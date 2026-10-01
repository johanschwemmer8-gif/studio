const mockGetAuthorizedRetailerId = jest.fn();
const mockGetRetailerAiGovernance = jest.fn();

jest.mock('@/lib/auth-server', () => ({
  getAuthorizedRetailerId: (
    ...args: unknown[]
  ) => mockGetAuthorizedRetailerId(...args),
}));

jest.mock(
  '@/lib/ai-governance/retailer-governance-repository',
  () => ({
    getRetailerAiGovernance: (
      ...args: unknown[]
    ) => mockGetRetailerAiGovernance(...args),
  })
);

jest.mock('genkit', () => ({
  z: require('zod').z,
}));

import {
  getRetailerAiGovernanceForRetailer,
} from './get-retailer-ai-governance';

describe(
  'getRetailerAiGovernanceForRetailer',
  () => {
    beforeEach(() => {
      jest.clearAllMocks();

      mockGetAuthorizedRetailerId.mockResolvedValue(
        'retailer-a'
      );

      mockGetRetailerAiGovernance.mockResolvedValue(
        null
      );
    });

    it('authorizes the requested retailer before reading governance', async () => {
      await getRetailerAiGovernanceForRetailer({
        idToken: 'token',
        retailerId: 'retailer-a',
      });

      expect(
        mockGetAuthorizedRetailerId
      ).toHaveBeenCalledWith(
        'token',
        'retailer-a'
      );

      expect(
        mockGetRetailerAiGovernance
      ).toHaveBeenCalledWith(
        'retailer-a'
      );
    });

    it('fails closed when retailer authorization fails', async () => {
      mockGetAuthorizedRetailerId.mockRejectedValue(
        new Error(
          'ACCESS_DENIED: Tenant mismatch.'
        )
      );

      await expect(
        getRetailerAiGovernanceForRetailer({
          idToken: 'token',
          retailerId: 'retailer-b',
        })
      ).rejects.toThrow(
        'ACCESS_DENIED: Tenant mismatch.'
      );

      expect(
        mockGetRetailerAiGovernance
      ).not.toHaveBeenCalled();
    });

    it('returns null when no retailer governance exists', async () => {
      const result =
        await getRetailerAiGovernanceForRetailer({
          idToken: 'token',
          retailerId: 'retailer-a',
        });

      expect(result).toEqual({
        governance: null,
      });
    });

    it('returns only the retailer governance control-plane fields', async () => {
      mockGetRetailerAiGovernance.mockResolvedValue({
        retailerId: 'retailer-a',
        governanceVersion: '1.0.0',
        status: 'ACTIVE',
        additiveRules: [
          {
            ruleId: 'rule-001',
            ruleType:
              'TRANSPARENCY_REQUIREMENT',
            platformControlId:
              'GOV-12-001',
            title:
              'AI Interaction Transparency',
            description:
              'Additional disclosure.',
            value:
              'Show additional disclosure.',
          },
        ],
        createdAt: 'created',
        createdBy: 'user-1',
        updatedAt: 'updated',
        updatedBy: 'user-2',
      });

      const result =
        await getRetailerAiGovernanceForRetailer({
          idToken: 'token',
          retailerId: 'retailer-a',
        });

      expect(result).toEqual({
        governance: {
          retailerId: 'retailer-a',
          governanceVersion: '1.0.0',
          status: 'ACTIVE',
          additiveRules: [
            {
              ruleId: 'rule-001',
              ruleType:
                'TRANSPARENCY_REQUIREMENT',
              platformControlId:
                'GOV-12-001',
              title:
                'AI Interaction Transparency',
              description:
                'Additional disclosure.',
              value:
                'Show additional disclosure.',
            },
          ],
        },
      });
    });
  }
);
