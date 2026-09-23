import type {
  ProfitRoiEvidenceReason,
  ProfitRoiMetric,
  ProfitRoiSnapshot,
} from '@/lib/schemas/profit-roi';
import {
  ProfitRoiInterpretationSchema,
  type ProfitRoiInterpretation,
  type ProfitRoiInterpretationStatement,
} from '@/lib/schemas/profit-roi-interpretation';

type EvidenceLevel = ProfitRoiMetric['evidenceLevel'];

const DISPLAYABLE_STATUSES = new Set<ProfitRoiMetric['status']>([
  'MEASURED',
  'NO_ACTIVITY',
]);

function canDisplayValue(metric: ProfitRoiMetric): boolean {
  return DISPLAYABLE_STATUSES.has(metric.status);
}

function evidenceRefs(metric: ProfitRoiMetric): string[] {
  return metric.source ? [metric.source] : [];
}

function statement(
  statementId: string,
  text: string,
  supportingMetricIds: string[],
  evidenceLevel: EvidenceLevel,
  refs: string[] = []
): ProfitRoiInterpretationStatement {
  return {
    statementId,
    text,
    supportingMetricIds,
    evidenceLevel,
    evidenceRefs: refs,
  };
}

function formatRand(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${new Intl.NumberFormat('en-ZA', {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMetricValue(metric: ProfitRoiMetric): string | null {
  if (!canDisplayValue(metric) || metric.value === null) {
    return null;
  }

  switch (metric.unit) {
    case 'RAND':
      return formatRand(metric.value);
    case 'PERCENT':
      return formatPercent(metric.value);
    case 'COUNT':
      return formatCount(metric.value);
    default:
      return null;
  }
}

const ACTION_BY_REASON: Partial<
  Record<ProfitRoiEvidenceReason, string>
> = {
  POS_DATA_MISSING:
    'Connect authoritative POS transaction evidence before evaluating POS-dependent commerce outcomes.',
  ATTRIBUTION_UNAVAILABLE:
    'Establish deterministic qualifying-session-to-transaction attribution before treating commerce as attributed to iNteract-assisted journeys.',
  BASELINE_UNAVAILABLE:
    'Establish an approved authoritative baseline before calculating basket increase.',
  COUNTERFACTUAL_UNAVAILABLE:
    'Establish an approved counterfactual before calculating incremental sales or sales uplift.',
  MARGIN_DATA_MISSING:
    'Provide authoritative margin evidence before calculating incremental commerce profit contribution.',
  LICENCE_COST_UNAVAILABLE:
    'Provide authoritative SaaS investment evidence before calculating licence cost offset or ROI.',
  RETAIL_MEDIA_REVENUE_UNAVAILABLE:
    'Provide authoritative recognised retailer-owned Retail Media revenue before measuring licence cost offset.',
  RMN_DELIVERY_COST_UNAVAILABLE:
    'Provide authoritative attributable Retail Media delivery costs before calculating net Retail Media contribution.',
  INCOMPLETE_COVERAGE:
    'Complete the required evidence coverage before treating the affected metric as measured.',
  INSUFFICIENT_SAMPLE:
    'Meet the approved evidence requirement before treating the affected metric as measured.',
  SCOPE_MISMATCH:
    'Align the underlying evidence to the selected organisational scope before financial reconciliation.',
  PERIOD_MISMATCH:
    'Align the underlying evidence to the selected reporting period before financial reconciliation.',
  CURRENCY_MISMATCH:
    'Provide compatible ZAR-denominated evidence before financial reconciliation.',
  SOURCE_UNAVAILABLE:
    'Restore the required authoritative source before treating the affected metric as measured.',
};

interface MetricEntry {
  id: string;
  metric: ProfitRoiMetric;
}

function allMetricEntries(snapshot: ProfitRoiSnapshot): MetricEntry[] {
  return [
    { id: 'saas_investment', metric: snapshot.investment.saasInvestment },

    {
      id: 'retail_media_revenue',
      metric: snapshot.retailMedia.retailMediaRevenue,
    },
    { id: 'brand_turnover', metric: snapshot.retailMedia.brandTurnover },
    {
      id: 'retail_media_attributed_sales',
      metric: snapshot.retailMedia.attributedSales,
    },
    {
      id: 'rmn_delivery_costs',
      metric: snapshot.retailMedia.rmnDeliveryCosts,
    },
    {
      id: 'net_retail_media_contribution',
      metric: snapshot.retailMedia.netRetailMediaContribution,
    },
    {
      id: 'licence_cost_offset_percentage',
      metric: snapshot.retailMedia.licenceCostOffsetPercentage,
    },
    {
      id: 'remaining_licence_cost',
      metric: snapshot.retailMedia.remainingLicenceCost,
    },
    {
      id: 'surplus_above_licence_cost',
      metric: snapshot.retailMedia.surplusAboveLicenceCost,
    },

    {
      id: 'verified_purchases',
      metric: snapshot.commerce.verifiedPurchases,
    },
    {
      id: 'commerce_attributed_sales',
      metric: snapshot.commerce.attributedSales,
    },
    {
      id: 'conversion_rate_percentage',
      metric: snapshot.commerce.conversionRatePercentage,
    },
    {
      id: 'average_attributed_basket',
      metric: snapshot.commerce.averageAttributedBasket,
    },
    {
      id: 'basket_increase_rand',
      metric: snapshot.commerce.basketIncreaseRand,
    },
    {
      id: 'basket_increase_percentage',
      metric: snapshot.commerce.basketIncreasePercentage,
    },
    {
      id: 'incremental_sales',
      metric: snapshot.commerce.incrementalSales,
    },
    {
      id: 'sales_uplift_percentage',
      metric: snapshot.commerce.salesUpliftPercentage,
    },

    {
      id: 'incremental_profit_contribution',
      metric: snapshot.profit.incrementalProfitContribution,
    },

    {
      id: 'total_financial_benefit',
      metric: snapshot.reconciliation.totalFinancialBenefit,
    },
    {
      id: 'net_financial_benefit',
      metric: snapshot.reconciliation.netFinancialBenefit,
    },
    {
      id: 'roi_percentage',
      metric: snapshot.reconciliation.roiPercentage,
    },

    { id: 'qr_exposures', metric: snapshot.funnel.qrExposures },
    {
      id: 'qualifying_shopper_sessions',
      metric: snapshot.funnel.qualifyingShopperSessions,
    },
    {
      id: 'ari_interactions',
      metric: snapshot.funnel.ariInteractions,
    },
    {
      id: 'supported_decision_signals',
      metric: snapshot.funnel.supportedDecisionSignals,
    },
    {
      id: 'funnel_verified_purchases',
      metric: snapshot.funnel.verifiedPurchases,
    },
    {
      id: 'funnel_attributed_sales',
      metric: snapshot.funnel.attributedSales,
    },
  ];
}

function uniqueSuggestedActions(
  entries: MetricEntry[]
): ProfitRoiInterpretationStatement[] {
  const emittedReasons = new Set<ProfitRoiEvidenceReason>();
  const actions: ProfitRoiInterpretationStatement[] = [];

  for (const { id, metric } of entries) {
    if (!metric.reason || emittedReasons.has(metric.reason)) {
      continue;
    }

    const action = ACTION_BY_REASON[metric.reason];
    if (!action) {
      continue;
    }

    emittedReasons.add(metric.reason);

    actions.push(
      statement(
        `action_${metric.reason.toLowerCase()}`,
        action,
        [id],
        metric.evidenceLevel,
        evidenceRefs(metric)
      )
    );
  }

  return actions;
}

export function interpretProfitRoiSnapshot(
  snapshot: ProfitRoiSnapshot
): ProfitRoiInterpretation {
  const parsedSnapshot = snapshot;
  const entries = allMetricEntries(parsedSnapshot);

  const factualObservations: ProfitRoiInterpretationStatement[] = [];
  const identifiedIndicators: ProfitRoiInterpretationStatement[] = [];

  const exposures = parsedSnapshot.funnel.qrExposures;
  const sessions = parsedSnapshot.funnel.qualifyingShopperSessions;
  const verifiedPurchases = parsedSnapshot.commerce.verifiedPurchases;
  const attributedSales = parsedSnapshot.commerce.attributedSales;
  const retailMediaRevenue = parsedSnapshot.retailMedia.retailMediaRevenue;
  const saasInvestment = parsedSnapshot.investment.saasInvestment;
  const licenceOffset =
    parsedSnapshot.retailMedia.licenceCostOffsetPercentage;
  const incrementalSales = parsedSnapshot.commerce.incrementalSales;
  const incrementalProfit =
    parsedSnapshot.profit.incrementalProfitContribution;
  const roi = parsedSnapshot.reconciliation.roiPercentage;

  const exposureValue = formatMetricValue(exposures);
  const sessionValue = formatMetricValue(sessions);

  if (exposureValue !== null && sessionValue !== null) {
    factualObservations.push(
      statement(
        'pod_activity',
        `${exposureValue} QR exposure${
          exposures.value === 1 ? '' : 's'
        } and ${sessionValue} qualifying Shopper Session${
          sessions.value === 1 ? '' : 's'
        } are recorded for the selected scope and reporting period.`,
        ['qr_exposures', 'qualifying_shopper_sessions'],
        sessions.evidenceLevel,
        [...evidenceRefs(exposures), ...evidenceRefs(sessions)]
      )
    );
  }

  const purchaseValue = formatMetricValue(verifiedPurchases);
  if (purchaseValue !== null) {
    factualObservations.push(
      statement(
        'verified_purchases',
        `${purchaseValue} verified purchase${
          verifiedPurchases.value === 1 ? '' : 's'
        } are represented by the authoritative commerce evidence.`,
        ['verified_purchases'],
        verifiedPurchases.evidenceLevel,
        evidenceRefs(verifiedPurchases)
      )
    );
  }

  const attributedSalesValue = formatMetricValue(attributedSales);
  if (attributedSalesValue !== null) {
    factualObservations.push(
      statement(
        'attributed_sales',
        `${attributedSalesValue} in sales is attributed through deterministic qualifying-session-to-production-transaction evidence. This is attributed commerce, not incremental sales or revenue generated by iNteract.`,
        ['commerce_attributed_sales'],
        attributedSales.evidenceLevel,
        evidenceRefs(attributedSales)
      )
    );
  }

  const retailMediaRevenueValue = formatMetricValue(retailMediaRevenue);
  if (retailMediaRevenueValue !== null) {
    factualObservations.push(
      statement(
        'retail_media_revenue',
        `${retailMediaRevenueValue} in recognised Retail Media revenue belongs to the retailer. It is not iNteract revenue.`,
        ['retail_media_revenue'],
        retailMediaRevenue.evidenceLevel,
        evidenceRefs(retailMediaRevenue)
      )
    );
  }

  const investmentValue = formatMetricValue(saasInvestment);
  if (investmentValue !== null) {
    factualObservations.push(
      statement(
        'saas_investment',
        `${investmentValue} in authoritative iNteract SaaS investment is represented for the selected scope and reporting period.`,
        ['saas_investment'],
        saasInvestment.evidenceLevel,
        evidenceRefs(saasInvestment)
      )
    );
  }

  const licenceOffsetValue = formatMetricValue(licenceOffset);
  if (licenceOffsetValue !== null) {
    identifiedIndicators.push(
      statement(
        'licence_cost_offset',
        `Recognised retailer-owned Retail Media revenue offsets ${licenceOffsetValue} of authoritative SaaS investment for the selected scope and period.`,
        ['retail_media_revenue', 'saas_investment', 'licence_cost_offset_percentage'],
        licenceOffset.evidenceLevel,
        evidenceRefs(licenceOffset)
      )
    );
  }

  const incrementalSalesValue = formatMetricValue(incrementalSales);
  if (incrementalSalesValue !== null) {
    identifiedIndicators.push(
      statement(
        'incremental_sales',
        `${incrementalSalesValue} in incremental sales is supported by the required E4 evidence for the selected scope and reporting period.`,
        ['incremental_sales'],
        incrementalSales.evidenceLevel,
        evidenceRefs(incrementalSales)
      )
    );
  }

  const incrementalProfitValue = formatMetricValue(incrementalProfit);
  if (incrementalProfitValue !== null) {
    identifiedIndicators.push(
      statement(
        'incremental_profit',
        `${incrementalProfitValue} in incremental commerce profit contribution is supported by authoritative margin evidence.`,
        ['incremental_profit_contribution'],
        incrementalProfit.evidenceLevel,
        evidenceRefs(incrementalProfit)
      )
    );
  }

  const roiValue = formatMetricValue(roi);
  if (roiValue !== null) {
    identifiedIndicators.push(
      statement(
        'roi',
        `Authoritative financial reconciliation produces an ROI of ${roiValue} for the selected scope and reporting period.`,
        ['roi_percentage'],
        roi.evidenceLevel,
        evidenceRefs(roi)
      )
    );
  }

  const suggestedActions = uniqueSuggestedActions(entries);

  const hasMeasuredEvidence = entries.some(
    ({ metric }) => metric.status === 'MEASURED'
  );
  const allActivityZero =
    exposures.status === 'NO_ACTIVITY' &&
    sessions.status === 'NO_ACTIVITY' &&
    exposures.value === 0 &&
    sessions.value === 0;

  const hasUnavailable = entries.some(
    ({ metric }) => metric.status === 'UNAVAILABLE'
  );
  const hasLimitedEvidence = entries.some(({ metric }) =>
    [
      'REQUIRES_POS_DATA',
      'INSUFFICIENT_EVIDENCE',
      'LIMITED_EVIDENCE',
    ].includes(metric.status)
  );

  let status: ProfitRoiInterpretation['status'];
  let statusDetail: string;

  if (allActivityZero && !hasMeasuredEvidence) {
    status = 'NO_ACTIVITY';
    statusDetail =
      'No authoritative Point-of-Decision activity is recorded for the selected scope and reporting period.';
  } else if (hasUnavailable && factualObservations.length === 0) {
    status = 'UNAVAILABLE';
    statusDetail =
      'Required authoritative evidence is unavailable, so no financial interpretation is presented as measured.';
  } else if (hasUnavailable || hasLimitedEvidence) {
    status = 'LIMITED_EVIDENCE';
    statusDetail =
      'Some authoritative evidence is available, but one or more financial conclusions remain evidence-gated.';
  } else {
    status = 'AVAILABLE';
    statusDetail =
      'The interpretation below is derived only from authoritative Profit & ROI evidence.';
  }

  return ProfitRoiInterpretationSchema.parse({
    status,
    factualObservations,
    identifiedIndicators,
    suggestedActions,
    statusDetail,
  });
}
