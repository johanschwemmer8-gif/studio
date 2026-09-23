/**
 * Pure Profit & ROI financial calculations.
 *
 * This module performs arithmetic only.
 * It does NOT establish whether source data is authoritative.
 * Evidence, tenancy, scope, period, currency, attribution,
 * baseline, counterfactual and margin eligibility must be
 * established before values reach this layer.
 *
 * FINANCIAL MODEL:
 *
 * Licence Cost Offset:
 *   recognised RMN revenue / SaaS investment
 *
 * Net Retail Media Contribution:
 *   recognised RMN revenue - authoritative RMN delivery costs
 *
 * Incremental Commerce Profit Contribution:
 *   E4 incremental sales × authoritative margin rate
 *
 * Total Financial Benefit:
 *   net RM contribution + incremental commerce profit contribution
 *
 * Net Financial Benefit:
 *   total financial benefit - SaaS investment
 *
 * ROI:
 *   net financial benefit / SaaS investment
 *
 * Brand Turnover and Attributed Sales are deliberately NOT
 * accepted as ROI-benefit inputs.
 */

export interface LicenceOffsetInput {
  saasInvestment: number;
  recognisedRetailMediaRevenue: number;
}

export interface LicenceOffsetResult {
  licenceCostOffsetPercentage: number;
  remainingLicenceCost: number;
  surplusAboveLicenceCost: number;
}

export interface NetRetailMediaContributionInput {
  recognisedRetailMediaRevenue: number;
  rmnDeliveryCosts: number;
}

export interface IncrementalCommerceProfitInput {
  incrementalSales: number;
  marginRate: number;
}

export interface FinancialReconciliationInput {
  saasInvestment: number;
  netRetailMediaContribution: number;
  incrementalCommerceProfitContribution: number;
}

export interface FinancialReconciliationResult {
  totalFinancialBenefit: number;
  netFinancialBenefit: number;
  roiPercentage: number;
}

function requireFiniteNonNegative(
  value: number,
  fieldName: string
): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `${fieldName} must be a finite non-negative number`
    );
  }

  return value;
}

function requirePositive(
  value: number,
  fieldName: string
): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `${fieldName} must be a finite number greater than zero`
    );
  }

  return value;
}

export function calculateLicenceOffset(
  input: LicenceOffsetInput
): LicenceOffsetResult {
  const saasInvestment = requirePositive(
    input.saasInvestment,
    'saasInvestment'
  );

  const recognisedRetailMediaRevenue = requireFiniteNonNegative(
    input.recognisedRetailMediaRevenue,
    'recognisedRetailMediaRevenue'
  );

  return {
    licenceCostOffsetPercentage:
      (recognisedRetailMediaRevenue / saasInvestment) * 100,

    remainingLicenceCost: Math.max(
      saasInvestment - recognisedRetailMediaRevenue,
      0
    ),

    surplusAboveLicenceCost: Math.max(
      recognisedRetailMediaRevenue - saasInvestment,
      0
    ),
  };
}

export function calculateNetRetailMediaContribution(
  input: NetRetailMediaContributionInput
): number {
  const recognisedRetailMediaRevenue = requireFiniteNonNegative(
    input.recognisedRetailMediaRevenue,
    'recognisedRetailMediaRevenue'
  );

  const rmnDeliveryCosts = requireFiniteNonNegative(
    input.rmnDeliveryCosts,
    'rmnDeliveryCosts'
  );

  return recognisedRetailMediaRevenue - rmnDeliveryCosts;
}

export function calculateIncrementalCommerceProfitContribution(
  input: IncrementalCommerceProfitInput
): number {
  const incrementalSales = requireFiniteNonNegative(
    input.incrementalSales,
    'incrementalSales'
  );

  const marginRate = input.marginRate;

  if (
    !Number.isFinite(marginRate) ||
    marginRate < 0 ||
    marginRate > 1
  ) {
    throw new RangeError(
      'marginRate must be a finite number between 0 and 1'
    );
  }

  return incrementalSales * marginRate;
}

export function calculateFinancialReconciliation(
  input: FinancialReconciliationInput
): FinancialReconciliationResult {
  const saasInvestment = requirePositive(
    input.saasInvestment,
    'saasInvestment'
  );

  if (!Number.isFinite(input.netRetailMediaContribution)) {
    throw new RangeError(
      'netRetailMediaContribution must be a finite number'
    );
  }

  const incrementalCommerceProfitContribution =
    requireFiniteNonNegative(
      input.incrementalCommerceProfitContribution,
      'incrementalCommerceProfitContribution'
    );

  const totalFinancialBenefit =
    input.netRetailMediaContribution +
    incrementalCommerceProfitContribution;

  const netFinancialBenefit =
    totalFinancialBenefit - saasInvestment;

  const roiPercentage =
    (netFinancialBenefit / saasInvestment) * 100;

  return {
    totalFinancialBenefit,
    netFinancialBenefit,
    roiPercentage,
  };
}