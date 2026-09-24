jest.mock('@/lib/profit-roi-evidence-server', () => ({
  getProfitRoiEvidence: jest.fn(),
}));

jest.mock('@/lib/profit-roi-interpretation', () => ({
  interpretProfitRoiSnapshot: jest.fn(),
}));

jest.mock('@/lib/ari-financial-intelligence', () => ({
  buildAriFinancialIntelligence: jest.fn(),
}));

import { getAriFinancialIntelligence } from '@/ai/flows/get-ari-financial-intelligence';
import { buildAriFinancialIntelligence } from '@/lib/ari-financial-intelligence';
import { getProfitRoiEvidence } from '@/lib/profit-roi-evidence-server';
import { interpretProfitRoiSnapshot } from '@/lib/profit-roi-interpretation';

const mockGetProfitRoiEvidence = getProfitRoiEvidence as jest.Mock;
const mockInterpretProfitRoiSnapshot =
  interpretProfitRoiSnapshot as jest.Mock;
const mockBuildAriFinancialIntelligence =
  buildAriFinancialIntelligence as jest.Mock;

describe('getAriFinancialIntelligence authoritative server boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('reacquires authoritative evidence server-side from authenticated identity and requested period', async () => {
    const authoritativeSnapshot = {
      source: 'SERVER_AUTHORITATIVE_SNAPSHOT',
    };

    const deterministicInterpretation = {
      source: 'DETERMINISTIC_INTERPRETATION',
    };

    const ariResult = {
      source: 'ARI_RESULT',
    };

    mockGetProfitRoiEvidence.mockResolvedValue(authoritativeSnapshot);
    mockInterpretProfitRoiSnapshot.mockReturnValue(
      deterministicInterpretation
    );
    mockBuildAriFinancialIntelligence.mockResolvedValue(ariResult);

    const result = await getAriFinancialIntelligence(
      'verified-id-token',
      'YTD'
    );

    expect(mockGetProfitRoiEvidence).toHaveBeenCalledTimes(1);
    expect(mockGetProfitRoiEvidence).toHaveBeenCalledWith(
      'verified-id-token',
      'YTD'
    );

    expect(mockInterpretProfitRoiSnapshot).toHaveBeenCalledTimes(1);
    expect(mockInterpretProfitRoiSnapshot).toHaveBeenCalledWith(
      authoritativeSnapshot
    );

    expect(mockBuildAriFinancialIntelligence).toHaveBeenCalledTimes(1);
    expect(mockBuildAriFinancialIntelligence).toHaveBeenCalledWith(
      deterministicInterpretation
    );

    expect(result).toBe(ariResult);
  });

  test('does not continue to interpretation when authoritative evidence acquisition fails', async () => {
    mockGetProfitRoiEvidence.mockRejectedValue(
      new Error('ROI_ACCESS_DENIED')
    );

    await expect(
      getAriFinancialIntelligence('unauthorized-token', 'MONTHLY')
    ).rejects.toThrow('ROI_ACCESS_DENIED');

    expect(mockInterpretProfitRoiSnapshot).not.toHaveBeenCalled();
    expect(mockBuildAriFinancialIntelligence).not.toHaveBeenCalled();
  });
});
