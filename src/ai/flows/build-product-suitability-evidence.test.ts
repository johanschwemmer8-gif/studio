const getMock = jest.fn();
const docMock = jest.fn(() => ({ get: getMock }));
const collectionMock = jest.fn(() => ({ doc: docMock }));

jest.mock("@/lib/firebase-admin", () => ({
  getDb: jest.fn(() => ({
    collection: collectionMock,
  })),
}));

const collectProductEvidenceMock = jest.fn();

jest.mock("@/lib/product-evidence-orchestrator", () => ({
  collectProductEvidence: (...args: unknown[]) =>
    collectProductEvidenceMock(...args),
}));

const createProvidersMock = jest.fn(() => [{ providerName: "test" }]);

jest.mock(
  "@/lib/product-evidence-providers/production-product-evidence",
  () => ({
    createProductionProductEvidenceProviders: () => createProvidersMock(),
  }),
);

import { buildProductSuitabilityEvidence } from "@/ai/flows/build-product-suitability-evidence";

const validSession = {
  sessionId: "session-1",
  retailerId: "retailer-1",
  campaignId: "campaign-1",
  activationId: "activation-1",
  deploymentId: "deployment-1",
  qrCodeId: "qr-1",
  configurationVersion: 1,
  environment: "PRODUCTION",
  startedAt: {
    seconds: 1,
    nanoseconds: 0,
  },
  lastInteractionAt: {
    seconds: 2,
    nanoseconds: 0,
  },
  entryGtin: "06001234567890",
};

describe("buildProductSuitabilityEvidence", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getMock.mockResolvedValue({
      exists: true,
      data: () => validSession,
    });

    collectProductEvidenceMock.mockResolvedValue({
      evidence: {
        identity: {
          gtin: "06001234567890",
          productName: "Test Product",
        },
        facts: [
          {
            key: "waterproof",
            label: "Waterproof",
            value: "Yes",
            source: {
              sourceType: "MANUFACTURER",
              sourceName: "Manufacturer",
              retrievedAt: "2026-09-26T10:00:00.000Z",
              identityMatched: true,
            },
            verificationState: "SUPPORTED",
            hasConflict: false,
          },
        ],
        evidenceState: "SUFFICIENT",
        limitations: [],
      },
      sourceResults: [],
    });
  });

  it("uses the authoritative session GTIN and retailer context", async () => {
    const result = await buildProductSuitabilityEvidence({
      sessionId: "session-1",
      requirement: {
        text: "I need something waterproof",
        sensitivity: "STANDARD",
      },
    });

    expect(result.success).toBe(true);

    expect(collectProductEvidenceMock).toHaveBeenCalledWith(
      { gtin: "06001234567890" },
      { retailerId: "retailer-1" },
      expect.any(Array),
    );

    if (result.success) {
      expect(result.assessment.product.gtin).toBe("06001234567890");
      expect(result.assessment.requirement.text).toBe(
        "I need something waterproof",
      );
    }
  });

  it("rejects an empty shopper requirement", async () => {
    const result = await buildProductSuitabilityEvidence({
      sessionId: "session-1",
      requirement: {
        text: "   ",
        sensitivity: "STANDARD",
      },
    });

    expect(result).toMatchObject({
      success: false,
      code: "INVALID_REQUIREMENT",
    });

    expect(collectProductEvidenceMock).not.toHaveBeenCalled();
  });

  it("fails closed when the session does not exist", async () => {
    getMock.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });

    const result = await buildProductSuitabilityEvidence({
      sessionId: "session-1",
      requirement: {
        text: "I need something lightweight",
        sensitivity: "STANDARD",
      },
    });

    expect(result).toMatchObject({
      success: false,
      code: "SESSION_UNAVAILABLE",
    });

    expect(collectProductEvidenceMock).not.toHaveBeenCalled();
  });

  it("fails closed when the session cannot establish Product A", async () => {
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({
        ...validSession,
        entryGtin: undefined,
      }),
    });

    const result = await buildProductSuitabilityEvidence({
      sessionId: "session-1",
      requirement: {
        text: "I need something lightweight",
        sensitivity: "STANDARD",
      },
    });

    expect(result).toMatchObject({
      success: false,
      code: "PRIMARY_PRODUCT_UNAVAILABLE",
    });

    expect(collectProductEvidenceMock).not.toHaveBeenCalled();
  });

  it("preserves the medical professional-advice boundary", async () => {
    const result = await buildProductSuitabilityEvidence({
      sessionId: "session-1",
      requirement: {
        text: "Is this suitable for my medical condition?",
        sensitivity: "MEDICAL",
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.assessment.requiresProfessionalAdvice).toBe(true);
      expect(result.assessment.outcome).toBe("INSUFFICIENT_EVIDENCE");
    }
  });
});
