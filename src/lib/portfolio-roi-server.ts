'use server';

/**
 * iNteract Portfolio ROI.
 *
 * Platform-operator-only cross-retailer evidence service.
 *
 * Invariants:
 * - canonical /tenants estate only
 * - no simulated or generated performance
 * - no retailer-user impersonation
 * - same Profit & ROI evidence kernel as Retailer MVP
 * - missing evidence remains missing evidence
 * - tenant lifecycle remains explicit
 */

import { verifyPlatformOperator } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';
import { getProfitRoiEvidenceForScope } from '@/lib/profit-roi-evidence-server';
import {
  normalizeTenantDocument,
  type TenantLifecycleStatus,
  type TenantType,
} from '@/lib/schemas/tenant';
import type {
  ProfitRoiMetric,
  ProfitRoiMetricStatus,
  ProfitRoiSnapshot,
} from '@/lib/schemas/profit-roi';
import type { OverviewPeriodGranularity } from '@/lib/schemas/overview-intelligence';

export type PortfolioEvidenceState =
  | 'MEASURED'
  | 'NO_ACTIVITY'
  | 'LIMITED_EVIDENCE'
  | 'REQUIRES_POS_DATA'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNAVAILABLE';

export type PortfolioRetailerEvidence = {
  retailerId: string;
  retailerName: string;
  tenantType: TenantType;
  lifecycleStatus: TenantLifecycleStatus;
  evidenceAvailable: boolean;
  evidenceError: string | null;
  shopperEvidenceStatus: PortfolioEvidenceState;
  commerceEvidenceStatus: PortfolioEvidenceState;
  financialEvidenceStatus: PortfolioEvidenceState;
  qrExposures: number | null;
  qualifyingShopperSessions: number | null;
  ariInteractions: number | null;
  supportedDecisionSignals: number | null;
  verifiedPurchases: number | null;
  netFinancialBenefit: number | null;
  roiPercentage: number | null;
  latestEvidenceAt: string | null;
};

export type PortfolioRoiResult = {
  calculatedAt: string;
  granularity: OverviewPeriodGranularity;
  portfolio: {
    totalRetailers: number;
    productionRetailers: number;
    activeRetailers: number;
    retailersWithShopperEvidence: number;
    retailersWithCommerceEvidence: number;
    retailersWithFinancialEvidence: number;
  };
  measuredActivity: {
    qrExposures: number | null;
    qualifyingShopperSessions: number | null;
    ariInteractions: number | null;
    supportedDecisionSignals: number | null;
    verifiedPurchases: number | null;
  };
  retailers: PortfolioRetailerEvidence[];
};

function displayable(metric: ProfitRoiMetric): boolean {
  return metric.status === 'MEASURED' || metric.status === 'NO_ACTIVITY';
}

function value(metric: ProfitRoiMetric): number | null {
  return displayable(metric) && metric.value !== null ? metric.value : null;
}

function evidenceState(metric: ProfitRoiMetric): PortfolioEvidenceState {
  return metric.status;
}

function hasEvidence(metric: ProfitRoiMetric): boolean {
  return metric.status === 'MEASURED' || metric.status === 'NO_ACTIVITY';
}

function sumKnown(
  snapshots: ProfitRoiSnapshot[],
  select: (snapshot: ProfitRoiSnapshot) => ProfitRoiMetric
): number | null {
  const metrics = snapshots.map(select).filter(displayable);

  if (metrics.length === 0) {
    return null;
  }

  return metrics.reduce((total, metric) => total + (metric.value ?? 0), 0);
}

function safeEvidenceError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'EVIDENCE_UNAVAILABLE';

  const permitted = new Set([
    'REPORTING_CALENDAR_UNAVAILABLE',
    'ORGANIZATION_CONFIGURATION_UNAVAILABLE',
    'ORGANIZATION_CONFIGURATION_INVALID',
    'ORGANIZATION_TENANT_MISMATCH',
    'INFRASTRUCTURE_UNAVAILABLE',
  ]);

  return permitted.has(message) ? message : 'EVIDENCE_UNAVAILABLE';
}

export async function getPortfolioRoi(
  idToken: string | undefined,
  granularity: OverviewPeriodGranularity = 'MONTHLY'
): Promise<PortfolioRoiResult> {
  await verifyPlatformOperator(idToken);

  const db = getDb();

  if (!db) {
    throw new Error('INFRASTRUCTURE_UNAVAILABLE');
  }

  const tenantSnapshot = await db.collection('tenants').get();

  const tenants = tenantSnapshot.docs
    .map(document =>
      normalizeTenantDocument(
        document.id,
        document.data() as Record<string, unknown>
      )
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const evidenceResults = await Promise.all(
    tenants.map(async tenant => {
      try {
        const snapshot = await getProfitRoiEvidenceForScope(
          tenant.id,
          {
            level: 'network',
            networkId: tenant.id,
          },
          granularity
        );

        return {
          tenant,
          snapshot,
          error: null,
        };
      } catch (error) {
        return {
          tenant,
          snapshot: null,
          error: safeEvidenceError(error),
        };
      }
    })
  );

  const snapshots = evidenceResults
    .map(result => result.snapshot)
    .filter((snapshot): snapshot is ProfitRoiSnapshot => snapshot !== null);

  const retailers: PortfolioRetailerEvidence[] = evidenceResults.map(
    ({ tenant, snapshot, error }) => {
      if (!snapshot) {
        return {
          retailerId: tenant.id,
          retailerName: tenant.name,
          tenantType: tenant.type,
          lifecycleStatus: tenant.lifecycleStatus,
          evidenceAvailable: false,
          evidenceError: error,
          shopperEvidenceStatus: 'UNAVAILABLE',
          commerceEvidenceStatus: 'UNAVAILABLE',
          financialEvidenceStatus: 'UNAVAILABLE',
          qrExposures: null,
          qualifyingShopperSessions: null,
          ariInteractions: null,
          supportedDecisionSignals: null,
          verifiedPurchases: null,
          netFinancialBenefit: null,
          roiPercentage: null,
          latestEvidenceAt: null,
        };
      }

      return {
        retailerId: tenant.id,
        retailerName: tenant.name,
        tenantType: tenant.type,
        lifecycleStatus: tenant.lifecycleStatus,
        evidenceAvailable: true,
        evidenceError: null,
        shopperEvidenceStatus: evidenceState(snapshot.funnel.qrExposures),
        commerceEvidenceStatus: evidenceState(snapshot.commerce.verifiedPurchases),
        financialEvidenceStatus: evidenceState(
          snapshot.reconciliation.roiPercentage
        ),
        qrExposures: value(snapshot.funnel.qrExposures),
        qualifyingShopperSessions: value(
          snapshot.funnel.qualifyingShopperSessions
        ),
        ariInteractions: value(snapshot.funnel.ariInteractions),
        supportedDecisionSignals: value(
          snapshot.funnel.supportedDecisionSignals
        ),
        verifiedPurchases: value(snapshot.commerce.verifiedPurchases),
        netFinancialBenefit: value(
          snapshot.reconciliation.netFinancialBenefit
        ),
        roiPercentage: value(snapshot.reconciliation.roiPercentage),
        latestEvidenceAt: snapshot.latestEvidenceAt,
      };
    }
  );

  return {
    calculatedAt: new Date().toISOString(),
    granularity,
    portfolio: {
      totalRetailers: tenants.length,
      productionRetailers: tenants.filter(
        tenant => tenant.type === 'production'
      ).length,
      activeRetailers: tenants.filter(
        tenant => tenant.lifecycleStatus === 'ACTIVE'
      ).length,
      retailersWithShopperEvidence: snapshots.filter(snapshot =>
        hasEvidence(snapshot.funnel.qrExposures)
      ).length,
      retailersWithCommerceEvidence: snapshots.filter(snapshot =>
        hasEvidence(snapshot.commerce.verifiedPurchases)
      ).length,
      retailersWithFinancialEvidence: snapshots.filter(snapshot =>
        hasEvidence(snapshot.reconciliation.roiPercentage)
      ).length,
    },
    measuredActivity: {
      qrExposures: sumKnown(
        snapshots,
        snapshot => snapshot.funnel.qrExposures
      ),
      qualifyingShopperSessions: sumKnown(
        snapshots,
        snapshot => snapshot.funnel.qualifyingShopperSessions
      ),
      ariInteractions: sumKnown(
        snapshots,
        snapshot => snapshot.funnel.ariInteractions
      ),
      supportedDecisionSignals: sumKnown(
        snapshots,
        snapshot => snapshot.funnel.supportedDecisionSignals
      ),
      verifiedPurchases: sumKnown(
        snapshots,
        snapshot => snapshot.commerce.verifiedPurchases
      ),
    },
    retailers,
  };
}
