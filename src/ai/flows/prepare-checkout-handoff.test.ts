const mockResolveBasketSessionAuthority = jest.fn();
const mockRunTransaction = jest.fn();
const mockTransactionGet = jest.fn();
const mockTransactionSet = jest.fn();
const mockBasketDoc = jest.fn();
const mockHandoffDoc = jest.fn();
const mockRandomUUID = jest.fn();

const NOW_SECONDS = 1_700_000_000;

const nowTimestamp = {
  seconds: NOW_SECONDS,
  nanoseconds: 0,
  toMillis: () => NOW_SECONDS * 1000,
};

jest.mock('crypto', () => ({
  randomUUID: () => mockRandomUUID(),
}));

jest.mock('@/lib/firebase-admin', () => ({
  admin: {
    firestore: Object.assign(
      jest.fn(),
      {
        Timestamp: {
          now: () => nowTimestamp,
          fromMillis: (millis: number) => ({
            seconds: Math.floor(millis / 1000),
            nanoseconds: 0,
          }),
        },
      }
    ),
  },
}));

jest.mock('@/lib/basket-authority', () => ({
  resolveBasketSessionAuthority: (...args: unknown[]) =>
    mockResolveBasketSessionAuthority(...args),
}));

import { prepareCheckoutHandoff } from './prepare-checkout-handoff';

const session = {
  sessionId: 'sess_123',
  retailerId: 'retailer_a',
  environment: 'PRODUCTION' as const,
};

function basket(overrides: Record<string, unknown> = {}) {
  return {
    basketId: 'basket_sess_123',
    sessionId: 'sess_123',
    retailerId: 'retailer_a',
    environment: 'PRODUCTION',
    items: [
      {
        gtin: '06009188000332',
        quantity: 2,
      },
    ],
    status: 'ACTIVE',
    createdAt: {
      seconds: NOW_SECONDS - 100,
      nanoseconds: 0,
    },
    updatedAt: {
      seconds: NOW_SECONDS - 100,
      nanoseconds: 0,
    },
    ...overrides,
  };
}

function handoff(overrides: Record<string, unknown> = {}) {
  return {
    checkoutHandoffId: 'handoff_existing',
    basketId: 'basket_sess_123',
    sessionId: 'sess_123',
    retailerId: 'retailer_a',
    environment: 'PRODUCTION',
    status: 'READY',
    createdAt: {
      seconds: NOW_SECONDS - 60,
      nanoseconds: 0,
    },
    expiresAt: {
      seconds: NOW_SECONDS + 240,
      nanoseconds: 0,
    },
    ...overrides,
  };
}

function snapshot(
  exists: boolean,
  data?: Record<string, unknown>
) {
  return {
    exists,
    data: () => data,
  };
}

describe('prepareCheckoutHandoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockRandomUUID.mockReturnValue('uuid-123');

    const db = {
      collection: jest.fn((name: string) => {
        if (name === 'baskets') {
          return {
            doc: mockBasketDoc,
          };
        }

        if (name === 'checkoutHandoffs') {
          return {
            doc: mockHandoffDoc,
          };
        }

        throw new Error(`UNEXPECTED_COLLECTION:${name}`);
      }),
      runTransaction: mockRunTransaction,
    };

    mockBasketDoc.mockReturnValue({
      kind: 'basket-ref',
    });

    mockHandoffDoc.mockReturnValue({
      kind: 'handoff-ref',
    });

    mockResolveBasketSessionAuthority.mockResolvedValue({
      db,
      session,
    });

    mockRunTransaction.mockImplementation(
      async (callback: (transaction: any) => unknown) =>
        callback({
          get: mockTransactionGet,
          set: mockTransactionSet,
        })
    );
  });

  it('creates a READY five-minute handoff and marks basket CHECKOUT_READY', async () => {
    mockTransactionGet
      .mockResolvedValueOnce(snapshot(true, basket()))
      .mockResolvedValueOnce(snapshot(false));

    const result = await prepareCheckoutHandoff({
      sessionId: 'sess_123',
    });

    expect(result.handoff.checkoutHandoffId).toBe(
      'handoff_uuid-123'
    );
    expect(result.handoff.status).toBe('READY');
    expect(result.handoff.expiresAt.seconds).toBe(
      NOW_SECONDS + 300
    );

    expect(result.basket.status).toBe('CHECKOUT_READY');

    expect(mockHandoffDoc).toHaveBeenCalledWith(
      'basket_sess_123'
    );

    expect(mockTransactionSet).toHaveBeenCalledTimes(2);

    const writtenHandoff = mockTransactionSet.mock.calls[0][1];
    const writtenBasket = mockTransactionSet.mock.calls[1][1];

    expect(writtenHandoff.checkoutHandoffId).toBe(
      'handoff_uuid-123'
    );
    expect(writtenHandoff.basketId).toBe(
      'basket_sess_123'
    );
    expect(writtenHandoff.sessionId).toBe('sess_123');
    expect(writtenHandoff.retailerId).toBe('retailer_a');

    expect(writtenBasket.status).toBe('CHECKOUT_READY');
  });

  it('reuses an existing unexpired READY handoff without minting another credential', async () => {
    const checkoutReadyBasket = basket({
      status: 'CHECKOUT_READY',
    });
    const existingHandoff = handoff();

    mockTransactionGet
      .mockResolvedValueOnce(
        snapshot(true, checkoutReadyBasket)
      )
      .mockResolvedValueOnce(
        snapshot(true, existingHandoff)
      );

    const result = await prepareCheckoutHandoff({
      sessionId: 'sess_123',
    });

    expect(result.handoff.checkoutHandoffId).toBe(
      'handoff_existing'
    );
    expect(mockRandomUUID).not.toHaveBeenCalled();
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('rejects a missing basket', async () => {
    mockTransactionGet
      .mockResolvedValueOnce(snapshot(false))
      .mockResolvedValueOnce(snapshot(false));

    await expect(
      prepareCheckoutHandoff({
        sessionId: 'sess_123',
      })
    ).rejects.toThrow('BASKET_NOT_FOUND');

    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('rejects basket authority mismatch', async () => {
    mockTransactionGet
      .mockResolvedValueOnce(
        snapshot(
          true,
          basket({
            retailerId: 'retailer_b',
          })
        )
      )
      .mockResolvedValueOnce(snapshot(false));

    await expect(
      prepareCheckoutHandoff({
        sessionId: 'sess_123',
      })
    ).rejects.toThrow('BASKET_AUTHORITY_MISMATCH');

    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('rejects an empty basket', async () => {
    mockTransactionGet
      .mockResolvedValueOnce(
        snapshot(true, basket({ items: [] }))
      )
      .mockResolvedValueOnce(snapshot(false));

    await expect(
      prepareCheckoutHandoff({
        sessionId: 'sess_123',
      })
    ).rejects.toThrow('BASKET_EMPTY');

    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('rejects a non-ACTIVE basket without a reusable handoff', async () => {
    mockTransactionGet
      .mockResolvedValueOnce(
        snapshot(
          true,
          basket({
            status: 'CHECKOUT_READY',
          })
        )
      )
      .mockResolvedValueOnce(snapshot(false));

    await expect(
      prepareCheckoutHandoff({
        sessionId: 'sess_123',
      })
    ).rejects.toThrow('BASKET_NOT_ACTIVE');

    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('rejects mismatched existing handoff authority', async () => {
    mockTransactionGet
      .mockResolvedValueOnce(
        snapshot(
          true,
          basket({
            status: 'CHECKOUT_READY',
          })
        )
      )
      .mockResolvedValueOnce(
        snapshot(
          true,
          handoff({
            retailerId: 'retailer_b',
          })
        )
      );

    await expect(
      prepareCheckoutHandoff({
        sessionId: 'sess_123',
      })
    ).rejects.toThrow(
      'CHECKOUT_HANDOFF_AUTHORITY_MISMATCH'
    );

    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('rejects an expired handoff when basket is already CHECKOUT_READY', async () => {
    mockTransactionGet
      .mockResolvedValueOnce(
        snapshot(
          true,
          basket({
            status: 'CHECKOUT_READY',
          })
        )
      )
      .mockResolvedValueOnce(
        snapshot(
          true,
          handoff({
            expiresAt: {
              seconds: NOW_SECONDS - 1,
              nanoseconds: 0,
            },
          })
        )
      );

    await expect(
      prepareCheckoutHandoff({
        sessionId: 'sess_123',
      })
    ).rejects.toThrow('BASKET_NOT_ACTIVE');

    expect(mockRandomUUID).not.toHaveBeenCalled();
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('does not create transaction or payment records', async () => {
    mockTransactionGet
      .mockResolvedValueOnce(snapshot(true, basket()))
      .mockResolvedValueOnce(snapshot(false));

    await prepareCheckoutHandoff({
      sessionId: 'sess_123',
    });

    const authorityResult =
      await mockResolveBasketSessionAuthority.mock.results[0]
        .value;

    const collectionCalls =
      authorityResult.db.collection.mock.calls.map(
        (call: unknown[]) => call[0]
      );

    expect(collectionCalls).toEqual([
      'baskets',
      'checkoutHandoffs',
    ]);

    expect(collectionCalls).not.toContain('transactions');
    expect(collectionCalls).not.toContain('payments');
  });
});
