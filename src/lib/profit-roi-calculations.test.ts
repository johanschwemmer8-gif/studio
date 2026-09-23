import {
  calculateFinancialReconciliation,
  calculateIncrementalCommerceProfitContribution,
  calculateLicenceOffset,
  calculateNetRetailMediaContribution,
} from './profit-roi-calculations';

describe('Profit & ROI financial calculations', () => {
  describe('calculateLicenceOffset', () => {
    it('calculates a partial licence cost offset', () => {
      const result = calculateLicenceOffset({
        saasInvestment: 1000,
        recognisedRetailMediaRevenue: 400,
      });

      expect(result).toEqual({
        licenceCostOffsetPercentage: 40,
        remainingLicenceCost: 600,
        surplusAboveLicenceCost: 0,
      });
    });

    it('calculates a full 100% licence cost offset', () => {
      const result = calculateLicenceOffset({
        saasInvestment: 1000,
        recognisedRetailMediaRevenue: 1000,
      });

      expect(result).toEqual({
        licenceCostOffsetPercentage: 100,
        remainingLicenceCost: 0,
        surplusAboveLicenceCost: 0,
      });
    });

    it('allows licence cost offset above 100% and exposes the surplus', () => {
      const result = calculateLicenceOffset({
        saasInvestment: 1000,
        recognisedRetailMediaRevenue: 1500,
      });

      expect(result).toEqual({
        licenceCostOffsetPercentage: 150,
        remainingLicenceCost: 0,
        surplusAboveLicenceCost: 500,
      });
    });

    it('allows zero recognised retail media revenue', () => {
      const result = calculateLicenceOffset({
        saasInvestment: 1000,
        recognisedRetailMediaRevenue: 0,
      });

      expect(result).toEqual({
        licenceCostOffsetPercentage: 0,
        remainingLicenceCost: 1000,
        surplusAboveLicenceCost: 0,
      });
    });

    it('rejects zero SaaS investment instead of manufacturing a percentage', () => {
      expect(() =>
        calculateLicenceOffset({
          saasInvestment: 0,
          recognisedRetailMediaRevenue: 500,
        })
      ).toThrow(RangeError);
    });

    it('rejects negative financial inputs', () => {
      expect(() =>
        calculateLicenceOffset({
          saasInvestment: 1000,
          recognisedRetailMediaRevenue: -1,
        })
      ).toThrow(RangeError);
    });

    it('rejects non-finite financial inputs', () => {
      expect(() =>
        calculateLicenceOffset({
          saasInvestment: Number.NaN,
          recognisedRetailMediaRevenue: 500,
        })
      ).toThrow(RangeError);

      expect(() =>
        calculateLicenceOffset({
          saasInvestment: 1000,
          recognisedRetailMediaRevenue: Number.POSITIVE_INFINITY,
        })
      ).toThrow(RangeError);
    });
  });

  describe('calculateNetRetailMediaContribution', () => {
    it('subtracts authoritative RMN delivery costs from recognised revenue', () => {
      expect(
        calculateNetRetailMediaContribution({
          recognisedRetailMediaRevenue: 1000,
          rmnDeliveryCosts: 250,
        })
      ).toBe(750);
    });

    it('allows a legitimate negative net RM contribution', () => {
      expect(
        calculateNetRetailMediaContribution({
          recognisedRetailMediaRevenue: 500,
          rmnDeliveryCosts: 800,
        })
      ).toBe(-300);
    });

    it('rejects negative RMN source values', () => {
      expect(() =>
        calculateNetRetailMediaContribution({
          recognisedRetailMediaRevenue: 1000,
          rmnDeliveryCosts: -1,
        })
      ).toThrow(RangeError);
    });
  });

  describe('calculateIncrementalCommerceProfitContribution', () => {
    it('calculates incremental commerce profit from E4 incremental sales and margin', () => {
      expect(
        calculateIncrementalCommerceProfitContribution({
          incrementalSales: 10000,
          marginRate: 0.25,
        })
      ).toBe(2500);
    });

    it('allows zero incremental sales', () => {
      expect(
        calculateIncrementalCommerceProfitContribution({
          incrementalSales: 0,
          marginRate: 0.25,
        })
      ).toBe(0);
    });

    it('accepts the margin boundaries of zero and one', () => {
      expect(
        calculateIncrementalCommerceProfitContribution({
          incrementalSales: 1000,
          marginRate: 0,
        })
      ).toBe(0);

      expect(
        calculateIncrementalCommerceProfitContribution({
          incrementalSales: 1000,
          marginRate: 1,
        })
      ).toBe(1000);
    });

    it('rejects margin rates outside zero to one', () => {
      expect(() =>
        calculateIncrementalCommerceProfitContribution({
          incrementalSales: 1000,
          marginRate: -0.01,
        })
      ).toThrow(RangeError);

      expect(() =>
        calculateIncrementalCommerceProfitContribution({
          incrementalSales: 1000,
          marginRate: 1.01,
        })
      ).toThrow(RangeError);
    });

    it('rejects negative incremental sales', () => {
      expect(() =>
        calculateIncrementalCommerceProfitContribution({
          incrementalSales: -1,
          marginRate: 0.25,
        })
      ).toThrow(RangeError);
    });
  });

  describe('calculateFinancialReconciliation', () => {
    it('calculates total benefit, net benefit and ROI', () => {
      const result = calculateFinancialReconciliation({
        saasInvestment: 1000,
        netRetailMediaContribution: 600,
        incrementalCommerceProfitContribution: 700,
      });

      expect(result).toEqual({
        totalFinancialBenefit: 1300,
        netFinancialBenefit: 300,
        roiPercentage: 30,
      });
    });

    it('preserves a negative ROI when benefit is below SaaS investment', () => {
      const result = calculateFinancialReconciliation({
        saasInvestment: 1000,
        netRetailMediaContribution: 300,
        incrementalCommerceProfitContribution: 200,
      });

      expect(result).toEqual({
        totalFinancialBenefit: 500,
        netFinancialBenefit: -500,
        roiPercentage: -50,
      });
    });

    it('preserves negative net RM contribution in final reconciliation', () => {
      const result = calculateFinancialReconciliation({
        saasInvestment: 1000,
        netRetailMediaContribution: -200,
        incrementalCommerceProfitContribution: 500,
      });

      expect(result).toEqual({
        totalFinancialBenefit: 300,
        netFinancialBenefit: -700,
        roiPercentage: -70,
      });
    });

    it('rejects zero SaaS investment instead of manufacturing ROI', () => {
      expect(() =>
        calculateFinancialReconciliation({
          saasInvestment: 0,
          netRetailMediaContribution: 500,
          incrementalCommerceProfitContribution: 500,
        })
      ).toThrow(RangeError);
    });

    it('rejects non-finite net retail media contribution', () => {
      expect(() =>
        calculateFinancialReconciliation({
          saasInvestment: 1000,
          netRetailMediaContribution: Number.NaN,
          incrementalCommerceProfitContribution: 500,
        })
      ).toThrow(RangeError);
    });

    it('rejects negative incremental commerce profit contribution', () => {
      expect(() =>
        calculateFinancialReconciliation({
          saasInvestment: 1000,
          netRetailMediaContribution: 500,
          incrementalCommerceProfitContribution: -1,
        })
      ).toThrow(RangeError);
    });
  });
});