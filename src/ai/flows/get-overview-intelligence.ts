'use server';

/**
 * Canonical Retailer Overview intelligence service.
 *
 * I.1.10C — authoritative server aggregation.
 *
 * This service deliberately begins with retailer-authoritative home-scope
 * evidence only. It does not accept arbitrary client-selected organizational
 * scope until authoritative hierarchy resolution is available.
 *
 * LIVE DATA ONLY:
 * No simulated, synthetic, demo, random or fallback metric values.
 */

import { subDays } from 'date-fns';

import { verifyAuth } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import { resolveOrganizationScope } from '@/lib/organization-scope-server';
import { resolveReportingCalendar } from '@/lib/reporting-calendar-server';
import { evaluateE2Eligibility } from '@/lib/transaction-attribution-server';
import { DeploymentSchema } from '@/lib/schemas/deployment';
import { TransactionSchema } from '@/lib/schemas/transaction';
import {
  ShopperSessionSchema,
  type ShopperSession,
} from '@/lib/schemas/shopper-session';
import {
  OverviewIntelligenceResponseSchema,
  type OverviewIntelligenceResponse,
  type OverviewMetric,
  type OverviewMetricId,
  type OverviewScope,
} from '@/lib/schemas/overview-intelligence';

const OVERVIEW_LOOKBACK_DAYS = 30;
const OVERVIEW_MAX_SOURCE_RECORDS = 5000;
const OVERVIEW_COMPLETENESS_PROBE_LIMIT =
  OVERVIEW_MAX_SOURCE_RECORDS + 1;

type TimestampLike = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
};

type EvidenceEvent = {
  id: string;
  sessionId?: string;
  eventType?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

function timestampMillis(value: unknown): number {
  if (!value || typeof value !== 'object') {
    return 0;
  }

  const timestamp = value as TimestampLike;

  if (typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate();

    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  if (
    typeof timestamp.seconds === 'number' &&
    Number.isFinite(timestamp.seconds) &&
    typeof timestamp.nanoseconds === 'number' &&
    Number.isFinite(timestamp.nanoseconds)
  ) {
    return (
      timestamp.seconds * 1000 +
      Math.floor(timestamp.nanoseconds / 1_000_000)
    );
  }

  return 0;
}

function measuredCount(
  metricId: OverviewMetricId,
  value: number,
  evidenceCount: number = value
): OverviewMetric {
  return {
    metricId,
    status: value === 0 ? 'NO_ACTIVITY' : 'MEASURED',
    value,
    unit: 'COUNT',
    evidenceLevel: 'E0',
    evidenceCount,
  };
}

function incompleteCoverageMetric(
  metricId: OverviewMetricId
): OverviewMetric {
  return {
    metricId,
    status: 'INSUFFICIENT_EVIDENCE',
    value: null,
    unit: 'COUNT',
    evidenceLevel: 'E0',
    evidenceCount: 0,
    reason: 'INCOMPLETE_COVERAGE',
    statusDetail:
      'The available evidence exceeds the current Overview aggregation boundary, so no incomplete measurement is displayed.',
  };
}

function requiresPosMetric(
  metricId: OverviewMetricId,
  unit: 'PERCENT' | 'RAND',
  evidenceLevel: 'E2' | 'E3' | 'E4'
): OverviewMetric {
  return {
    metricId,
    status: 'REQUIRES_POS_DATA',
    value: null,
    unit,
    evidenceLevel,
    evidenceCount: 0,
    reason: 'POS_DATA_MISSING',
    statusDetail: 'Requires POS Data',
  };
}

function insufficientCommercialEvidenceMetric(
  metricId: OverviewMetricId,
  unit: 'PERCENT' | 'RAND',
  evidenceLevel: 'E2' | 'E3' | 'E4',
  reason:
    | 'ATTRIBUTION_UNAVAILABLE'
    | 'BASELINE_UNAVAILABLE'
    | 'INSUFFICIENT_SAMPLE'
    | 'INCOMPLETE_COVERAGE'
    | 'COMPARISON_INVALID'
    | 'SCOPE_MISMATCH',
  statusDetail: string,
  evidenceCount = 0
): OverviewMetric {
  return {
    metricId,
    status: 'INSUFFICIENT_EVIDENCE',
    value: null,
    unit,
    evidenceLevel,
    evidenceCount,
    reason,
    statusDetail,
  };
}

function measuredCommercialMetric(
  metricId: OverviewMetricId,
  unit: 'PERCENT' | 'RAND',
  evidenceLevel: 'E2' | 'E3' | 'E4',
  value: number,
  evidenceCount: number
): OverviewMetric {
  return {
    metricId,
    status: 'MEASURED',
    value,
    unit,
    evidenceLevel,
    evidenceCount,
  };
}

function authorizationFailed(
  result: Awaited<ReturnType<typeof verifyAuth>>
): result is { uid: ''; error: string } {
  return result.uid === '';
}

function toOverviewScope(
  scope: Awaited<ReturnType<typeof verifyAuth>> extends infer _T
    ? {
        level: 'network' | 'brand' | 'division' | 'region' | 'area' | 'store';
        networkId?: string;
        brandId?: string;
        divisionId?: string;
        regionId?: string;
        areaId?: string;
        storeId?: string;
      }
    : never
): OverviewScope {
  return {
    level: scope.level,
    ...(scope.networkId ? { networkId: scope.networkId } : {}),
    ...(scope.brandId ? { brandId: scope.brandId } : {}),
    ...(scope.divisionId ? { divisionId: scope.divisionId } : {}),
    ...(scope.regionId ? { regionId: scope.regionId } : {}),
    ...(scope.areaId ? { areaId: scope.areaId } : {}),
    ...(scope.storeId ? { storeId: scope.storeId } : {}),
  };
}

function factualStatement(
  statement: string,
  supportingMetricIds: OverviewMetricId[],
  evidenceRefs: string[]
) {
  return {
    type: 'FACTUAL_OBSERVATION' as const,
    statement,
    evidenceClass: 'DERIVED' as const,
    evidenceStrength: 'LOW' as const,
    supportingMetricIds,
    evidenceRefs,
  };
}

export async function getOverviewIntelligence(
  idToken: string | undefined
): Promise<OverviewIntelligenceResponse> {
  const auth = await verifyAuth(idToken);

  if (authorizationFailed(auth)) {
    throw new Error(auth.error);
  }

  if (!auth.retailerId) {
    throw new Error('RETAILER_AUTHORIZATION_REQUIRED');
  }

  if (!auth.permissions.dashboard) {
    throw new Error('DASHBOARD_ACCESS_DENIED');
  }

  const db = getDb();

  if (!db) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const retailerId = auth.retailerId;
  const startTime = subDays(new Date(), OVERVIEW_LOOKBACK_DAYS);
  const endTime = new Date();

  /**
   * Resolve the authenticated user's canonical organizational home scope.
   *
   * Organization node IDs are authoritative. Deployment.storeId is the
   * deterministic bridge from organizational scope into POD evidence.
   */
  const [resolvedScope, reportingCalendar] = await Promise.all([
    resolveOrganizationScope(
      retailerId,
      auth.scope
    ),
    resolveReportingCalendar(retailerId),
  ]);

  const authorizedStoreIds = new Set(resolvedScope.storeIds);

  /**
   * Load retailer-owned Deployments, validate the canonical Deployment
   * contract, then retain only Deployments belonging to the authenticated
   * organizational scope.
   *
   * We deliberately do not infer Store ownership from names, provinces,
   * GTINs, shopper behaviour or client-selected values.
   */
  const deploymentSnapshot = await db
    .collection('deployments')
    .where('retailerId', '==', retailerId)
    .get();

  const authorizedDeploymentIds = new Set<string>();
  const authorizedDeploymentStoreIds = new Map<string, string>();

  for (const document of deploymentSnapshot.docs) {
    const deployment = DeploymentSchema.parse(document.data());

    if (deployment.retailerId !== retailerId) {
      throw new Error('DEPLOYMENT_TENANT_MISMATCH');
    }

    /**
     * Deployment removal ends current/future operational eligibility; it does
     * not erase the Deployment's historical identity. Authoritative evidence
     * recorded against a Deployment remains attributable after removal.
     */
    if (authorizedStoreIds.has(deployment.storeId)) {
      authorizedDeploymentIds.add(deployment.deploymentId);
      authorizedDeploymentStoreIds.set(
        deployment.deploymentId,
        deployment.storeId
      );
    }
  }

  /**
   * Evidence is first tenant-constrained in Firestore, then deterministically
   * constrained to the authenticated organizational scope by Deployment ID.
   */
  const [
    exposureSnapshot,
    sessionSnapshot,
    eventSnapshot,
    transactionSnapshot,
  ] = await Promise.all([
    db
      .collection('qrExposures')
      .where('retailerId', '==', retailerId)
      .where('timestamp', '>=', startTime)
      .limit(OVERVIEW_COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('sessions')
      .where('retailerId', '==', retailerId)
      .where('startedAt', '>=', startTime)
      .limit(OVERVIEW_COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('events')
      .where('retailerId', '==', retailerId)
      .where('timestamp', '>=', startTime)
      .limit(OVERVIEW_COMPLETENESS_PROBE_LIMIT)
      .get(),

    db
      .collection('transactions')
      .where('retailerId', '==', retailerId)
      .where('timestamp', '>=', startTime)
      .limit(OVERVIEW_COMPLETENESS_PROBE_LIMIT)
      .get(),
  ]);

  const exposureSourceComplete =
    exposureSnapshot.docs.length <= OVERVIEW_MAX_SOURCE_RECORDS;
  const sessionSourceComplete =
    sessionSnapshot.docs.length <= OVERVIEW_MAX_SOURCE_RECORDS;
  const eventSourceComplete =
    eventSnapshot.docs.length <= OVERVIEW_MAX_SOURCE_RECORDS;
  const transactionSourceComplete =
    transactionSnapshot.docs.length <= OVERVIEW_MAX_SOURCE_RECORDS;

  const exposureDocuments = exposureSourceComplete
    ? exposureSnapshot.docs
    : [];
  const sessionDocuments = sessionSourceComplete
    ? sessionSnapshot.docs
    : [];
  const eventDocuments = eventSourceComplete
    ? eventSnapshot.docs
    : [];
  const transactionDocuments = transactionSourceComplete
    ? transactionSnapshot.docs
    : [];

  const exposureRefs: string[] = [];
  let latestEvidenceAtMillis = 0;

  for (const document of exposureDocuments) {
    const data = document.data() as Record<string, unknown>;
    const timestamp = timestampMillis(data.timestamp);

    const deploymentId =
      typeof data.deploymentId === 'string' ? data.deploymentId : undefined;

    if (
      timestamp <= 0 ||
      !deploymentId ||
      !authorizedDeploymentIds.has(deploymentId)
    ) {
      continue;
    }

    exposureRefs.push(`qrExposures/${document.id}`);
    latestEvidenceAtMillis = Math.max(latestEvidenceAtMillis, timestamp);
  }

  const sessionIds = new Set<string>();
  const sessionRefs: string[] = [];
  const sessionsById = new Map<string, ShopperSession>();

  for (const document of sessionDocuments) {
    const sessionResult = ShopperSessionSchema.safeParse(document.data());

    if (!sessionResult.success) {
      continue;
    }

    const session = sessionResult.data;

    /**
     * Firestore document identity and canonical Session identity must agree.
     * A mismatched document cannot become authoritative Overview evidence.
     */
    if (session.sessionId !== document.id) {
      continue;
    }

    if (session.retailerId !== retailerId) {
      throw new Error('SESSION_TENANT_MISMATCH');
    }

    if (!authorizedDeploymentIds.has(session.deploymentId)) {
      continue;
    }

    const startedAt = timestampMillis(session.startedAt);

    sessionIds.add(session.sessionId);
    sessionsById.set(session.sessionId, session);
    sessionRefs.push(`sessions/${session.sessionId}`);

    if (startedAt > 0) {
      latestEvidenceAtMillis = Math.max(
        latestEvidenceAtMillis,
        startedAt
      );
    }
  }

  /**
   * E1 commerce evidence:
   * valid, VERIFIED, PRODUCTION retailer transactions.
   *
   * A valid transaction does not automatically become iNteract-attributed
   * evidence. E2 still requires deterministic Shopper Session verification.
   */
  const authoritativeProductionTransactions = transactionDocuments.flatMap(
    (document) => {
      const result = TransactionSchema.safeParse(document.data());

      if (!result.success) {
        return [];
      }

      if (result.data.retailerId !== retailerId) {
        throw new Error('TRANSACTION_TENANT_MISMATCH');
      }

      return result.data.environment === 'PRODUCTION'
        ? [result.data]
        : [];
    }
  );

  const e2EligibleTransactions =
    authoritativeProductionTransactions.flatMap((transaction) => {
      if (!transaction.sessionId) {
        return [];
      }

      const session = sessionsById.get(transaction.sessionId);

      if (!session) {
        return [];
      }

      const eligibility = evaluateE2Eligibility({
        transaction,
        session,
        expectedSessionId: transaction.sessionId,
        authorizedDeploymentStoreIds,
      });

      return eligibility.eligible ? [eligibility] : [];
    });

  /**
   * Commercial Conversion denominator:
   * canonical PRODUCTION qualifying Shopper Sessions in the already
   * authorized organizational scope and requested Overview period.
   *
   * TEST and DEMO Sessions remain valid operational records but cannot
   * enter a production commercial KPI.
   */
  const eligibleProductionSessionIds = new Set(
    Array.from(sessionsById.values())
      .filter((session) => session.environment === 'PRODUCTION')
      .map((session) => session.sessionId)
  );

  /**
   * Multiple authoritative purchases during one Shopper Session represent
   * one converted Session for Conversion Rate.
   */
  const convertedSessionIds = new Set(
    e2EligibleTransactions.map(
      (eligibility) => eligibility.session.sessionId
    )
  );


  /**
   * E3 Basket Size Increase requires more than authoritative production
   * transaction evidence. It also requires a valid, authoritative comparison
   * baseline. Overview must never invent or select that baseline itself.
   */
  const basketSizeIncreasePercentMetric =
    authoritativeProductionTransactions.length === 0
      ? requiresPosMetric(
          'basket_size_increase_percent',
          'PERCENT',
          'E3'
        )
      : insufficientCommercialEvidenceMetric(
          'basket_size_increase_percent',
          'PERCENT',
          'E3',
          'BASELINE_UNAVAILABLE',
          'Authoritative production transaction evidence exists, but no valid E3 comparison baseline has been established.'
        );

  const basketSizeIncreaseRandMetric =
    authoritativeProductionTransactions.length === 0
      ? requiresPosMetric(
          'basket_size_increase_rand',
          'RAND',
          'E3'
        )
      : insufficientCommercialEvidenceMetric(
          'basket_size_increase_rand',
          'RAND',
          'E3',
          'BASELINE_UNAVAILABLE',
          'Authoritative production transaction evidence exists, but no valid E3 comparison baseline has been established.'
        );


  /**
   * E4 Sales Uplift requires authoritative production commerce evidence plus
   * a defensible counterfactual/control methodology. Attributed or observed
   * sales alone must never be represented as incremental sales.
   */
  const salesUpliftPercentMetric =
    authoritativeProductionTransactions.length === 0
      ? requiresPosMetric(
          'sales_uplift_percent',
          'PERCENT',
          'E4'
        )
      : insufficientCommercialEvidenceMetric(
          'sales_uplift_percent',
          'PERCENT',
          'E4',
          'BASELINE_UNAVAILABLE',
          'Authoritative production transaction evidence exists, but no valid E4 counterfactual or control baseline has been established.'
        );

  let conversionRateMetric: OverviewMetric;

  if (!transactionSourceComplete) {
    conversionRateMetric = insufficientCommercialEvidenceMetric(
      'conversion_rate_percent',
      'PERCENT',
      'E2',
      'INCOMPLETE_COVERAGE',
      'Transaction evidence exceeds the current Overview aggregation boundary, so no incomplete Conversion Rate is displayed.'
    );
  } else if (authoritativeProductionTransactions.length === 0) {
    conversionRateMetric = requiresPosMetric(
      'conversion_rate_percent',
      'PERCENT',
      'E2'
    );
  } else if (
    e2EligibleTransactions.length === 0 ||
    eligibleProductionSessionIds.size === 0
  ) {
    conversionRateMetric = insufficientCommercialEvidenceMetric(
      'conversion_rate_percent',
      'PERCENT',
      'E2',
      'ATTRIBUTION_UNAVAILABLE',
      'Authoritative production transaction evidence exists, but deterministic E2 Shopper Session attribution is not sufficient to calculate Conversion Rate.',
      e2EligibleTransactions.length
    );
  } else {
    /**
     * E2 proves deterministic purchase attribution for converted Sessions,
     * but it does not by itself prove that transaction/POS coverage is
     * complete for every qualifying production Shopper Session in the
     * denominator.
     *
     * Until an authoritative Checkout Sync / POS coverage contract exists,
     * Overview must not interpret Sessions without attributed transactions
     * as observed non-conversions.
     */
    conversionRateMetric = insufficientCommercialEvidenceMetric(
      'conversion_rate_percent',
      'PERCENT',
      'E2',
      'INCOMPLETE_COVERAGE',
      'Deterministic E2 purchase attribution exists, but authoritative transaction coverage for the full qualifying Shopper Session denominator has not yet been established.',
      convertedSessionIds.size
    );
  }

  const events: EvidenceEvent[] = eventDocuments
    .map((document) => {
      const data = document.data() as Record<string, unknown>;

      return {
        id: document.id,
        sessionId:
          typeof data.sessionId === 'string' ? data.sessionId : undefined,
        eventType:
          typeof data.eventType === 'string' ? data.eventType : undefined,
        timestamp: timestampMillis(data.timestamp),
        metadata:
          data.metadata &&
          typeof data.metadata === 'object' &&
          !Array.isArray(data.metadata)
            ? (data.metadata as Record<string, unknown>)
            : undefined,
      };
    })
    .filter(
      (event) =>
        Boolean(event.sessionId) &&
        sessionIds.has(event.sessionId as string) &&
        event.timestamp > 0
    );

  for (const event of events) {
    latestEvidenceAtMillis = Math.max(
      latestEvidenceAtMillis,
      event.timestamp
    );
  }

  const interactionEvents = events.filter(
    (event) => event.eventType === 'interaction_signal'
  );

  /**
   * Headline decision evidence excludes inferred AI interpretation.
   * Explicit and deterministic/derived signals may contribute.
   */
  const factualDecisionSignals = interactionEvents.filter(
    (event) => event.metadata?.evidenceType !== 'inferred'
  );

  const signalType = (event: EvidenceEvent): string | undefined => {
    const value = event.metadata?.type;
    return typeof value === 'string' ? value : undefined;
  };

  const informationRequests = factualDecisionSignals.filter(
    (event) => signalType(event) === 'information_request'
  );

  const productComparisons = factualDecisionSignals.filter(
    (event) => signalType(event) === 'product_comparison'
  );

  const purchaseBarrierSignalTypes = new Set([
    'purchase_barrier',
    'product_concern',
    'price_objection',
  ]);

  const purchaseBarriersConcerns = factualDecisionSignals.filter((event) => {
    const type = signalType(event);
    return Boolean(type && purchaseBarrierSignalTypes.has(type));
  });

  const productConsideration = factualDecisionSignals.filter(
    (event) => signalType(event) === 'product_consideration'
  );

  const qrExposuresMetric = exposureSourceComplete
    ? measuredCount('qr_exposures', exposureRefs.length)
    : incompleteCoverageMetric('qr_exposures');

  const qualifyingSessionsMetric = sessionSourceComplete
    ? measuredCount('qualifying_shopper_sessions', sessionIds.size)
    : incompleteCoverageMetric('qualifying_shopper_sessions');

  const behaviouralSourcesComplete =
    sessionSourceComplete && eventSourceComplete;

  const ariInteractionsMetric = behaviouralSourcesComplete
    ? measuredCount('ari_interactions', interactionEvents.length)
    : incompleteCoverageMetric('ari_interactions');

  const decisionSignalsMetric = behaviouralSourcesComplete
    ? measuredCount('decision_signals', factualDecisionSignals.length)
    : incompleteCoverageMetric('decision_signals');

  const informationRequestsMetric = behaviouralSourcesComplete
    ? measuredCount('information_requests', informationRequests.length)
    : incompleteCoverageMetric('information_requests');

  const productComparisonsMetric = behaviouralSourcesComplete
    ? measuredCount('product_comparisons', productComparisons.length)
    : incompleteCoverageMetric('product_comparisons');

  const purchaseBarriersMetric = behaviouralSourcesComplete
    ? measuredCount(
        'purchase_barriers_concerns',
        purchaseBarriersConcerns.length
      )
    : incompleteCoverageMetric('purchase_barriers_concerns');

  const productConsiderationMetric = behaviouralSourcesComplete
    ? measuredCount('product_consideration', productConsideration.length)
    : incompleteCoverageMetric('product_consideration');

  const factualObservations = [];

  if (!exposureSourceComplete || !sessionSourceComplete) {
    // No factual activity statement is emitted from incomplete source coverage.
  } else if (exposureRefs.length === 0 && sessionIds.size === 0) {
    factualObservations.push(
      factualStatement(
        'No verified QR exposure or qualifying shopper interaction activity was recorded for this period.',
        ['qr_exposures', 'qualifying_shopper_sessions'],
        []
      )
    );
  } else if (exposureRefs.length > 0 && sessionIds.size === 0) {
    factualObservations.push(
      factualStatement(
        `${exposureRefs.length} verified QR exposure${
          exposureRefs.length === 1 ? '' : 's'
        } were recorded, with no qualifying Shopper Sessions in this period.`,
        ['qr_exposures', 'qualifying_shopper_sessions'],
        exposureRefs
      )
    );
  } else {
    factualObservations.push(
      factualStatement(
        `${exposureRefs.length} verified QR exposure${
          exposureRefs.length === 1 ? '' : 's'
        } and ${sessionIds.size} qualifying Shopper Session${
          sessionIds.size === 1 ? '' : 's'
        } were recorded in this period.`,
        ['qr_exposures', 'qualifying_shopper_sessions'],
        [...exposureRefs, ...sessionRefs]
      )
    );
  }

  const summaryStatus =
    !exposureSourceComplete ||
    !sessionSourceComplete ||
    !eventSourceComplete
      ? 'UNAVAILABLE'
      : exposureRefs.length === 0 && sessionIds.size === 0
        ? 'NO_ACTIVITY'
        : 'AVAILABLE';

  const response: OverviewIntelligenceResponse = {
    retailerId,

    scope: toOverviewScope(auth.scope),

    timeWindow: {
      startAt: startTime.toISOString(),
      endAt: endTime.toISOString(),
      granularity: 'DAILY',

      financialYearStartMonth:
        reportingCalendar?.financialYearStartMonth ?? null,
      timezone:
        reportingCalendar?.timezone ?? null,
    },

    freshness: {
      calculatedAt: endTime.toISOString(),
      latestEvidenceAt:
        latestEvidenceAtMillis > 0
          ? new Date(latestEvidenceAtMillis).toISOString()
          : null,
    },

    commercialOutcomes: {
      basketSizeIncreasePercent: basketSizeIncreasePercentMetric,
      basketSizeIncreaseRand: basketSizeIncreaseRandMetric,
      salesUpliftPercent: salesUpliftPercentMetric,
      conversionRatePercent: conversionRateMetric,
    },

    pointOfDecisionActivity: {
      qrExposures: qrExposuresMetric,
      qualifyingShopperSessions: qualifyingSessionsMetric,
      ariInteractions: ariInteractionsMetric,
      decisionSignals: decisionSignalsMetric,
    },

    activityIntelligence: {
      informationRequests: informationRequestsMetric,
      productComparisons: productComparisonsMetric,
      purchaseBarriersConcerns: purchaseBarriersMetric,
      productConsideration: productConsiderationMetric,
    },

    trends: [],

    groundedSummary: {
      status: summaryStatus,
      factualObservations,
      identifiedIndicators: [],
      suggestedActions: [],
      ...(summaryStatus === 'UNAVAILABLE'
        ? {
            statusDetail:
              'Overview evidence coverage is incomplete for this period, so no grounded summary is displayed.',
          }
        : {}),
    },
  };

  /**
   * Fail closed if the server constructs an invalid production contract.
   */
  return OverviewIntelligenceResponseSchema.parse(response);
}
