/**
 * Pure authoritative Profit & ROI evidence assembly.
 *
 * LIVE DATA ONLY:
 * - No simulated, synthetic, demo, random or fallback financial values.
 * - E2 establishes deterministic attributed commerce only.
 * - E2 does not establish incrementality, profit or ROI.
 * - Missing higher-order financial evidence fails closed.
 *
 * This module deliberately has no 'use server' directive.
 * It contains deterministic evidence assembly only.
 */

import { evaluateE2Eligibility } from '@/lib/transaction-attribution-server';

import {
  ShopperSessionSchema,
  type ShopperSession,
} from '@/lib/schemas/shopper-session';

import {
  TransactionSchema,
  type Transaction,
} from '@/lib/schemas/transaction';

import {
  ProfitRoiSnapshotSchema,
  type ProfitRoiMetric,
  type ProfitRoiSnapshot,
} from '@/lib/schemas/profit-roi';

import type {
  OverviewPeriodGranularity,
  OverviewScope,
} from '@/lib/schemas/overview-intelligence';
type TimestampLike = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
};

export type RawEvidenceDocument = {
  id: string;
  data: Record<string, unknown>;
};

export type ProfitRoiEvidenceAssemblyInput = {
  retailerId: string;
  scope: OverviewScope;
  reportingPeriod: {
    granularity: OverviewPeriodGranularity;
    startAt: Date;
    endAt: Date;
    timezone: string;
    financialYearStartMonth: number;
  };
  authorizedDeploymentStoreIds: ReadonlyMap<string, string>;
  sessions: RawEvidenceDocument[];
  transactions: RawEvidenceDocument[];
  exposures: RawEvidenceDocument[];
  events: RawEvidenceDocument[];
  sourcesComplete: {
    sessions: boolean;
    transactions: boolean;
    exposures: boolean;
    events: boolean;
  };
  calculatedAt: Date;
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
    Number.isFinite(timestamp.seconds)
  ) {
    const nanoseconds =
      typeof timestamp.nanoseconds === 'number' &&
      Number.isFinite(timestamp.nanoseconds)
        ? timestamp.nanoseconds
        : 0;

    return (
      timestamp.seconds * 1000 +
      Math.floor(nanoseconds / 1_000_000)
    );
  }

  return 0;
}

function measuredCount(
  value: number,
  evidenceCount = value,
  evidenceLevel: 'E0' | 'E1' | 'E2' | 'E3' | 'E4' = 'E0',
  source?: string
): ProfitRoiMetric {
  return {
    status: value === 0 ? 'NO_ACTIVITY' : 'MEASURED',
    value,
    unit: 'COUNT',
    currency: null,
    evidenceLevel,
    evidenceCount,
    ...(source ? { source } : {}),
  };
}

function measuredRand(
  value: number,
  evidenceCount: number,
  evidenceLevel: 'E1' | 'E2' | 'E3' | 'E4',
  source: string
): ProfitRoiMetric {
  return {
    status: value === 0 ? 'NO_ACTIVITY' : 'MEASURED',
    value,
    unit: 'RAND',
    currency: 'ZAR',
    evidenceLevel,
    evidenceCount,
    source,
  };
}

function unavailable(
  unit: 'COUNT' | 'PERCENT' | 'RAND',
  evidenceLevel: 'E0' | 'E1' | 'E2' | 'E3' | 'E4',
  reason:
    | 'POS_DATA_MISSING'
    | 'ATTRIBUTION_UNAVAILABLE'
    | 'BASELINE_UNAVAILABLE'
    | 'COUNTERFACTUAL_UNAVAILABLE'
    | 'MARGIN_DATA_MISSING'
    | 'LICENCE_COST_UNAVAILABLE'
    | 'RETAIL_MEDIA_REVENUE_UNAVAILABLE'
    | 'RMN_DELIVERY_COST_UNAVAILABLE'
    | 'INCOMPLETE_COVERAGE'
    | 'INSUFFICIENT_SAMPLE'
    | 'SCOPE_MISMATCH'
    | 'PERIOD_MISMATCH'
    | 'CURRENCY_MISMATCH'
    | 'SOURCE_UNAVAILABLE',
  statusDetail: string,
  status:
    | 'REQUIRES_POS_DATA'
    | 'INSUFFICIENT_EVIDENCE'
    | 'UNAVAILABLE'
    | 'LIMITED_EVIDENCE' = 'UNAVAILABLE',
  evidenceCount = 0
): ProfitRoiMetric {
  return {
    status,
    value: null,
    unit,
    currency: unit === 'RAND' ? 'ZAR' : null,
    evidenceLevel,
    evidenceCount,
    reason,
    statusDetail,
  };
}

function incomplete(
  unit: 'COUNT' | 'PERCENT' | 'RAND',
  evidenceLevel: 'E0' | 'E1' | 'E2' | 'E3' | 'E4',
  detail: string
): ProfitRoiMetric {
  return unavailable(
    unit,
    evidenceLevel,
    'INCOMPLETE_COVERAGE',
    detail,
    'INSUFFICIENT_EVIDENCE'
  );
}

function withinPeriod(
  timestamp: unknown,
  startAt: Date,
  endAt: Date
): boolean {
  const millis = timestampMillis(timestamp);

  return (
    millis >= startAt.getTime() &&
    millis < endAt.getTime()
  );
}

export function assembleProfitRoiEvidence(
  input: ProfitRoiEvidenceAssemblyInput
): ProfitRoiSnapshot {
  const sessionsById = new Map<string, ShopperSession>();
  let latestEvidenceAtMillis = 0;

  for (const document of input.sessions) {
    const parsed = ShopperSessionSchema.safeParse(document.data);

    if (!parsed.success) {
      continue;
    }

    const session = parsed.data;

    if (
      session.sessionId !== document.id ||
      session.retailerId !== input.retailerId ||
      session.environment !== 'PRODUCTION' ||
      !input.authorizedDeploymentStoreIds.has(session.deploymentId) ||
      !withinPeriod(
        session.startedAt,
        input.reportingPeriod.startAt,
        input.reportingPeriod.endAt
      )
    ) {
      continue;
    }

    sessionsById.set(session.sessionId, session);
    latestEvidenceAtMillis = Math.max(
      latestEvidenceAtMillis,
      timestampMillis(session.startedAt)
    );
  }

  const productionTransactions: Transaction[] = [];
  let hasNonZarTransaction = false;

  for (const document of input.transactions) {
    const parsed = TransactionSchema.safeParse(document.data);

    if (!parsed.success) {
      continue;
    }

    const transaction = parsed.data;

    if (transaction.retailerId !== input.retailerId) {
      throw new Error('TRANSACTION_TENANT_MISMATCH');
    }

    if (
      transaction.environment !== 'PRODUCTION' ||
      !withinPeriod(
        transaction.timestamp,
        input.reportingPeriod.startAt,
        input.reportingPeriod.endAt
      )
    ) {
      continue;
    }

    if (transaction.currency !== 'ZAR') {
      hasNonZarTransaction = true;
      continue;
    }

    productionTransactions.push(transaction);

    latestEvidenceAtMillis = Math.max(
      latestEvidenceAtMillis,
      timestampMillis(transaction.timestamp)
    );
  }

  const e2Eligible = productionTransactions.flatMap(transaction => {
    if (!transaction.sessionId) {
      return [];
    }

    const session = sessionsById.get(transaction.sessionId);

    if (!session) {
      return [];
    }

    const result = evaluateE2Eligibility({
      transaction,
      session,
      expectedSessionId: transaction.sessionId,
      authorizedDeploymentStoreIds:
        input.authorizedDeploymentStoreIds,
    });

    return result.eligible ? [result] : [];
  });

  const attributedSalesValue = e2Eligible.reduce(
    (sum, item) => sum + item.transaction.amount,
    0
  );

  const exposureCount = input.exposures.filter(document => {
    const deploymentId =
      typeof document.data.deploymentId === 'string'
        ? document.data.deploymentId
        : undefined;

    const eligible =
      Boolean(deploymentId) &&
      input.authorizedDeploymentStoreIds.has(
        deploymentId as string
      ) &&
      withinPeriod(
        document.data.timestamp,
        input.reportingPeriod.startAt,
        input.reportingPeriod.endAt
      );

    if (eligible) {
      latestEvidenceAtMillis = Math.max(
        latestEvidenceAtMillis,
        timestampMillis(document.data.timestamp)
      );
    }

    return eligible;
  }).length;

  const scopedSessionIds = new Set(sessionsById.keys());

  const scopedEvents = input.events.filter(document => {
    const sessionId =
      typeof document.data.sessionId === 'string'
        ? document.data.sessionId
        : undefined;

    const eligible =
      Boolean(sessionId) &&
      scopedSessionIds.has(sessionId as string) &&
      withinPeriod(
        document.data.timestamp,
        input.reportingPeriod.startAt,
        input.reportingPeriod.endAt
      );

    if (eligible) {
      latestEvidenceAtMillis = Math.max(
        latestEvidenceAtMillis,
        timestampMillis(document.data.timestamp)
      );
    }

    return eligible;
  });

  const interactionEvents = scopedEvents.filter(
    document => document.data.eventType === 'interaction_signal'
  );

  const supportedDecisionSignals = interactionEvents.filter(document => {
    const metadata = document.data.metadata;

    return !(
      metadata &&
      typeof metadata === 'object' &&
      !Array.isArray(metadata) &&
      (metadata as Record<string, unknown>).evidenceType === 'inferred'
    );
  });

  const verifiedPurchasesMetric =
    !input.sourcesComplete.transactions ||
    !input.sourcesComplete.sessions
      ? incomplete(
          'COUNT',
          'E2',
          'Transaction or Shopper Session evidence exceeds the current aggregation boundary, so no incomplete E2 purchase count is displayed.'
        )
      : productionTransactions.length === 0
        ? unavailable(
            'COUNT',
            'E2',
            'POS_DATA_MISSING',
            'Requires POS Data',
            'REQUIRES_POS_DATA'
          )
        : e2Eligible.length === 0
          ? unavailable(
              'COUNT',
              'E2',
              'ATTRIBUTION_UNAVAILABLE',
              'Authoritative production transactions exist, but deterministic E2 Shopper Session attribution is unavailable.',
              'INSUFFICIENT_EVIDENCE'
            )
          : measuredCount(
              e2Eligible.length,
              e2Eligible.length,
              'E2',
              'transactions + canonical shopper sessions'
            );

  let attributedSalesMetric: ProfitRoiMetric;

  if (
    !input.sourcesComplete.transactions ||
    !input.sourcesComplete.sessions
  ) {
    attributedSalesMetric = incomplete(
      'RAND',
      'E2',
      'Transaction or Shopper Session evidence exceeds the current aggregation boundary, so no incomplete attributed-sales value is displayed.'
    );
  } else if (hasNonZarTransaction) {
    attributedSalesMetric = unavailable(
      'RAND',
      'E2',
      'CURRENCY_MISMATCH',
      'Profit & ROI financial aggregation is ZAR-only. Non-ZAR production transaction evidence is present in the selected period.',
      'INSUFFICIENT_EVIDENCE'
    );
  } else if (productionTransactions.length === 0) {
    attributedSalesMetric = unavailable(
      'RAND',
      'E2',
      'POS_DATA_MISSING',
      'Requires POS Data',
      'REQUIRES_POS_DATA'
    );
  } else if (e2Eligible.length === 0) {
    attributedSalesMetric = unavailable(
      'RAND',
      'E2',
      'ATTRIBUTION_UNAVAILABLE',
      'Authoritative production transactions exist, but deterministic E2 Shopper Session attribution is unavailable.',
      'INSUFFICIENT_EVIDENCE'
    );
  } else {
    attributedSalesMetric = measuredRand(
      attributedSalesValue,
      e2Eligible.length,
      'E2',
      'transactions + canonical shopper sessions'
    );
  }

  const averageAttributedBasketMetric =
    attributedSalesMetric.status === 'MEASURED' &&
    e2Eligible.length > 0
      ? measuredRand(
          attributedSalesValue / e2Eligible.length,
          e2Eligible.length,
          'E2',
          'E2 attributed sales / verified purchases'
        )
      : {
          ...attributedSalesMetric,
          source: undefined,
        };

  const saasInvestment = unavailable(
    'RAND',
    'E1',
    'LICENCE_COST_UNAVAILABLE',
    'No authoritative SaaS investment source is currently available for this scope and reporting period.'
  );

  const retailMediaRevenue = unavailable(
    'RAND',
    'E1',
    'RETAIL_MEDIA_REVENUE_UNAVAILABLE',
    'No authoritative recognised Retail Media revenue source is currently available for this scope and reporting period.'
  );

  const rmnDeliveryCosts = unavailable(
    'RAND',
    'E1',
    'RMN_DELIVERY_COST_UNAVAILABLE',
    'No authoritative attributable Retail Media delivery-cost source is currently available for this scope and reporting period.'
  );

  const baselineUnavailableRand = unavailable(
    'RAND',
    'E3',
    'BASELINE_UNAVAILABLE',
    'No authoritative E3 comparison baseline has been established.',
    'INSUFFICIENT_EVIDENCE'
  );

  const baselineUnavailablePercent = unavailable(
    'PERCENT',
    'E3',
    'BASELINE_UNAVAILABLE',
    'No authoritative E3 comparison baseline has been established.',
    'INSUFFICIENT_EVIDENCE'
  );

  const counterfactualUnavailableRand = unavailable(
    'RAND',
    'E4',
    'COUNTERFACTUAL_UNAVAILABLE',
    'No authoritative E4 counterfactual or control methodology has been established.',
    'INSUFFICIENT_EVIDENCE'
  );

  const counterfactualUnavailablePercent = unavailable(
    'PERCENT',
    'E4',
    'COUNTERFACTUAL_UNAVAILABLE',
    'No authoritative E4 counterfactual or control methodology has been established.',
    'INSUFFICIENT_EVIDENCE'
  );

  const incrementalProfitUnavailable = unavailable(
    'RAND',
    'E4',
    'MARGIN_DATA_MISSING',
    'Incremental commerce profit requires both E4 incremental sales and an authoritative margin basis.',
    'INSUFFICIENT_EVIDENCE'
  );

  const financialReconciliationUnavailable = unavailable(
    'RAND',
    'E4',
    'SOURCE_UNAVAILABLE',
    'Financial reconciliation requires authoritative SaaS investment, Net Retail Media Contribution and incremental commerce profit evidence.',
    'INSUFFICIENT_EVIDENCE'
  );

  const roiUnavailable = unavailable(
    'PERCENT',
    'E4',
    'SOURCE_UNAVAILABLE',
    'ROI requires authoritative SaaS investment and complete financial-benefit evidence.',
    'INSUFFICIENT_EVIDENCE'
  );

  const conversionUnavailable =
    productionTransactions.length === 0
      ? unavailable(
          'PERCENT',
          'E2',
          'POS_DATA_MISSING',
          'Requires POS Data',
          'REQUIRES_POS_DATA'
        )
      : unavailable(
          'PERCENT',
          'E2',
          'INCOMPLETE_COVERAGE',
          'E2 purchase attribution may exist, but authoritative transaction coverage for the full qualifying-session denominator has not been established.',
          'INSUFFICIENT_EVIDENCE',
          e2Eligible.length
        );

  const snapshot: ProfitRoiSnapshot = {
    scope: input.scope,
    reportingPeriod: {
      granularity: input.reportingPeriod.granularity,
      startAt: input.reportingPeriod.startAt.toISOString(),
      endAt: input.reportingPeriod.endAt.toISOString(),
      timezone: input.reportingPeriod.timezone,
      financialYearStartMonth:
        input.reportingPeriod.financialYearStartMonth,
    },
    calculatedAt: input.calculatedAt.toISOString(),
    latestEvidenceAt:
      latestEvidenceAtMillis > 0
        ? new Date(latestEvidenceAtMillis).toISOString()
        : null,

    investment: {
      saasInvestment,
    },

    retailMedia: {
      retailMediaRevenue,
      brandTurnover: unavailable(
        'RAND',
        'E1',
        'SOURCE_UNAVAILABLE',
        'No authoritative Retail Media brand-turnover source is currently available for this scope and reporting period.'
      ),
      attributedSales: attributedSalesMetric,
      rmnDeliveryCosts,
      netRetailMediaContribution: unavailable(
        'RAND',
        'E1',
        'SOURCE_UNAVAILABLE',
        'Net Retail Media Contribution requires authoritative recognised Retail Media revenue and attributable delivery costs.'
      ),
      licenceCostOffsetPercentage: unavailable(
        'PERCENT',
        'E1',
        'SOURCE_UNAVAILABLE',
        'Licence Cost Offset requires authoritative SaaS investment and recognised Retail Media revenue.'
      ),
      remainingLicenceCost: unavailable(
        'RAND',
        'E1',
        'SOURCE_UNAVAILABLE',
        'Remaining Licence Cost requires authoritative SaaS investment and recognised Retail Media revenue.'
      ),
      surplusAboveLicenceCost: unavailable(
        'RAND',
        'E1',
        'SOURCE_UNAVAILABLE',
        'Retail Media surplus requires authoritative SaaS investment and recognised Retail Media revenue.'
      ),
    },

    commerce: {
      verifiedPurchases: verifiedPurchasesMetric,
      attributedSales: attributedSalesMetric,
      conversionRatePercentage: conversionUnavailable,
      averageAttributedBasket: averageAttributedBasketMetric,
      basketIncreaseRand: baselineUnavailableRand,
      basketIncreasePercentage: baselineUnavailablePercent,
      incrementalSales: counterfactualUnavailableRand,
      salesUpliftPercentage: counterfactualUnavailablePercent,
    },

    profit: {
      marginBasis: null,
      incrementalProfitContribution:
        incrementalProfitUnavailable,
    },

    reconciliation: {
      totalFinancialBenefit: financialReconciliationUnavailable,
      netFinancialBenefit: financialReconciliationUnavailable,
      roiPercentage: roiUnavailable,
    },

    funnel: {
      qrExposures: input.sourcesComplete.exposures
        ? measuredCount(
            exposureCount,
            exposureCount,
            'E0',
            'qrExposures'
          )
        : incomplete(
            'COUNT',
            'E0',
            'QR exposure evidence exceeds the current aggregation boundary.'
          ),

      qualifyingShopperSessions: input.sourcesComplete.sessions
        ? measuredCount(
            sessionsById.size,
            sessionsById.size,
            'E0',
            'canonical production shopper sessions'
          )
        : incomplete(
            'COUNT',
            'E0',
            'Shopper Session evidence exceeds the current aggregation boundary.'
          ),

      ariInteractions:
        input.sourcesComplete.sessions &&
        input.sourcesComplete.events
          ? measuredCount(
              interactionEvents.length,
              interactionEvents.length,
              'E0',
              'session-anchored interaction events'
            )
          : incomplete(
              'COUNT',
              'E0',
              'Interaction evidence exceeds the current aggregation boundary.'
            ),

      supportedDecisionSignals:
        input.sourcesComplete.sessions &&
        input.sourcesComplete.events
          ? measuredCount(
              supportedDecisionSignals.length,
              supportedDecisionSignals.length,
              'E0',
              'explicit or deterministic decision signals'
            )
          : incomplete(
              'COUNT',
              'E0',
              'Decision-signal evidence exceeds the current aggregation boundary.'
            ),

      verifiedPurchases: verifiedPurchasesMetric,
      attributedSales: attributedSalesMetric,
    },
  };

  return ProfitRoiSnapshotSchema.parse(snapshot);
}


