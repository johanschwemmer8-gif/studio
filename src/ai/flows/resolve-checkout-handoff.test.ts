const mockVerifyAuth = jest.fn();
const mockGetDb = jest.fn();
const mockCollection = jest.fn();
const mockWhere = jest.fn();
const mockLimit = jest.fn();
const mockQueryGet = jest.fn();
const mockBasketDoc = jest.fn();
const mockRunTransaction = jest.fn();
const mockTransactionGet = jest.fn();
const mockTransactionSet = jest.fn();

const NOW_SECONDS = 1_700_000_000;

const nowTimestamp = {
  seconds: NOW_SECONDS,
  nanoseconds: 0,
};

const handoffRef = {
  kind: 'handoff-ref',
};

const basketRef = {
  kind: 'basket-ref',
};

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: (...args: unknown[]) =>
    mockVerifyAuth(...args),
}));

jest.mock('@/lib/firebase-admin', () => ({
  admin: {
    firestore: Object.assign(
      jest.fn(),
      {
        Timestamp: {
          now: () => nowTimestamp,
        },
      }
    ),
  },
  getDb: () => mockGetDb(),
}));

import { resolveCheckoutHandoff } from './resolve-checkout-handoff';

function authorizedUser() {
  return {
    uid: 'retailer-user-1',
    retailerId: 'retailer_a',
    role: 'storeUser',
    scope: {
      level: 'store',
      networkId: 'network_a',
      storeId: 'store_a',
    },
    permissions: {
      dashboard: true,
      roi: false,
      visualsReporting: false,
      realTime: false,
      systemIntegration: true,
      retailMediaNetwork: false,
      manageUsers: false,
      manageOrganization: false,
      approve: false,
      export: false,
    },
    isActive: true,
  };
}

function handoff(overrides: Record<string, unknown> = {}) {
  return {
    checkoutHandoffId: 'handoff_abc',
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
        productName: 'Canonical Product',
        displayedUnitPrice: 100,
      },
    ],
    status: 'CHECKOUT_READY',
    createdAt: {
      seconds: NOW_SECONDS - 300,
      nanoseconds: 0,
    },
    updatedAt: {
      seconds: NOW_SECONDS - 60,
      nanoseconds: 0,
    },
    ...overrides,
  };
}

function docSnapshot(
  exists: boolean,
  data?: Record<string, unknown>,
  ref: unknown = handoffRef
) {
  return {
    exists,
    ref,
    data: () => data,
  };
}

function querySnapshot(
  docs: Array<ReturnType<typeof docSnapshot>>
) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
  };
}

describe('resolveCheckoutHandoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockVerifyAuth.mockResolvedValue(authorizedUser());

    mockWhere.mockReturnValue({
      limit: mockLimit,
    });

    mockLimit.mockReturnValue({
      get: mockQueryGet,
    });

    mockCollection.mockImplementation((name: string) => {
      if (name === 'checkoutHandoffs') {
        return {
          where: mockWhere,
        };
      }

      if (name === 'baskets') {
        return {
          doc: mockBasketDoc,
        };
      }

      throw new Error(`UNEXPECTED_COLLECTION:${name}`);
    });

    mockBasketDoc.mockReturnValue(basketRef);

    mockRunTransaction.mockImplementation(
      async (callback: (transaction: any) => unknown) =>
        callback({
          get: mockTransactionGet,
          set: mockTransactionSet,
        })
    );

    mockGetDb.mockReturnValue({
      collection: mockCollection,
      runTransaction: mockRunTransaction,
    });
  });

  it('resolves an authoritative READY handoff and marks the basket HANDED_OFF', async () => {
    const canonicalHandoff = handoff();
    const canonicalBasket = basket();

    mockQueryGet.mockResolvedValue(
      querySnapshot([
        docSnapshot(
          true,
          canonicalHandoff,
          handoffRef
        ),
      ])
    );

    mockTransactionGet
      .mockResolvedValueOnce(
        docSnapshot(
          true,
          canonicalHandoff,
          handoffRef
        )
      )
      .mockResolvedValueOnce(
        docSnapshot(
          true,
          canonicalBasket,
          basketRef
        )
      );

    const result = await resolveCheckoutHandoff({
      idToken: 'valid-token',
      checkoutHandoffId: 'handoff_abc',
    });

    expect(mockVerifyAuth).toHaveBeenCalledWith(
      'valid-token'
    );

    expect(mockWhere).toHaveBeenCalledWith(
      'checkoutHandoffId',
      '==',
      'handoff_abc'
    );

    expect(mockLimit).toHaveBeenCalledWith(2);

    expect(result).toEqual({
      checkoutHandoffId: 'handoff_abc',
      basketId: 'basket_sess_123',
      retailerId: 'retailer_a',
      status: 'RESOLVED',
      items: [
        {
          gtin: '06009188000332',
          quantity: 2,
          productName: 'Canonical Product',
        },
      ],
    });

    expect(mockTransactionSet).toHaveBeenCalledTimes(2);

    const resolvedHandoff =
      mockTransactionSet.mock.calls[0][1];

    const handedOffBasket =
      mockTransactionSet.mock.calls[1][1];

    expect(resolvedHandoff.status).toBe('RESOLVED');
    expect(resolvedHandoff.resolvedAt).toEqual(
      nowTimestamp
    );

    expect(handedOffBasket.status).toBe('HANDED_OFF');
  });

  it('fails closed when retailer authentication fails', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'Authentication required.',
    });

    await expect(
      resolveCheckoutHandoff({
        idToken: 'invalid-token',
        checkoutHandoffId: 'handoff_abc',
      })
    ).rejects.toThrow('Authentication required.');

    expect(mockQueryGet).not.toHaveBeenCalled();
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('rejects a handoff belonging to another retailer', async () => {
    mockQueryGet.mockResolvedValue(
      querySnapshot([
        docSnapshot(
          true,
          handoff({
            retailerId: 'retailer_b',
          })
        ),
      ])
    );

    await expect(
      resolveCheckoutHandoff({
        idToken: 'valid-token',
        checkoutHandoffId: 'handoff_abc',
      })
    ).rejects.toThrow(
      'ACCESS_DENIED: Tenant mismatch.'
    );

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('rejects an unknown handoff credential', async () => {
    mockQueryGet.mockResolvedValue(
      querySnapshot([])
    );

    await expect(
      resolveCheckoutHandoff({
        idToken: 'valid-token',
        checkoutHandoffId: 'handoff_missing',
      })
    ).rejects.toThrow('CHECKOUT_HANDOFF_NOT_FOUND');

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('fails closed when a credential resolves to duplicate records', async () => {
    mockQueryGet.mockResolvedValue(
      querySnapshot([
        docSnapshot(true, handoff()),
        docSnapshot(true, handoff()),
      ])
    );

    await expect(
      resolveCheckoutHandoff({
        idToken: 'valid-token',
        checkoutHandoffId: 'handoff_abc',
      })
    ).rejects.toThrow(
      'CHECKOUT_HANDOFF_INTEGRITY_ERROR'
    );

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('rejects an expired handoff before transaction resolution', async () => {
    mockQueryGet.mockResolvedValue(
      querySnapshot([
        docSnapshot(
          true,
          handoff({
            expiresAt: {
              seconds: NOW_SECONDS - 1,
              nanoseconds: 0,
            },
          })
        ),
      ])
    );

    await expect(
      resolveCheckoutHandoff({
        idToken: 'valid-token',
        checkoutHandoffId: 'handoff_abc',
      })
    ).rejects.toThrow('CHECKOUT_HANDOFF_EXPIRED');

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('rejects a handoff that is not READY', async () => {
    mockQueryGet.mockResolvedValue(
      querySnapshot([
        docSnapshot(
          true,
          handoff({
            status: 'RESOLVED',
            resolvedAt: nowTimestamp,
          })
        ),
      ])
    );

    await expect(
      resolveCheckoutHandoff({
        idToken: 'valid-token',
        checkoutHandoffId: 'handoff_abc',
      })
    ).rejects.toThrow(
      'CHECKOUT_HANDOFF_NOT_READY'
    );

    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it('rechecks expiry inside the transaction', async () => {
    const preflightHandoff = handoff();

    mockQueryGet.mockResolvedValue(
      querySnapshot([
        docSnapshot(
          true,
          preflightHandoff,
          handoffRef
        ),
      ])
    );

    mockTransactionGet
      .mockResolvedValueOnce(
        docSnapshot(
          true,
          handoff({
            expiresAt: {
              seconds: NOW_SECONDS,
              nanoseconds: 0,
            },
          }),
          handoffRef
        )
      )
      .mockResolvedValueOnce(
        docSnapshot(
          true,
          basket(),
          basketRef
        )
      );

    await expect(
      resolveCheckoutHandoff({
        idToken: 'valid-token',
        checkoutHandoffId: 'handoff_abc',
      })
    ).rejects.toThrow('CHECKOUT_HANDOFF_EXPIRED');

    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('rejects basket and handoff authority mismatch', async () => {
    const canonicalHandoff = handoff();

    mockQueryGet.mockResolvedValue(
      querySnapshot([
        docSnapshot(
          true,
          canonicalHandoff,
          handoffRef
        ),
      ])
    );

    mockTransactionGet
      .mockResolvedValueOnce(
        docSnapshot(
          true,
          canonicalHandoff,
          handoffRef
        )
      )
      .mockResolvedValueOnce(
        docSnapshot(
          true,
          basket({
            sessionId: 'sess_other',
          }),
          basketRef
        )
      );

    await expect(
      resolveCheckoutHandoff({
        idToken: 'valid-token',
        checkoutHandoffId: 'handoff_abc',
      })
    ).rejects.toThrow(
      'CHECKOUT_HANDOFF_AUTHORITY_MISMATCH'
    );

    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('rejects a basket that is not CHECKOUT_READY', async () => {
    const canonicalHandoff = handoff();

    mockQueryGet.mockResolvedValue(
      querySnapshot([
        docSnapshot(
          true,
          canonicalHandoff,
          handoffRef
        ),
      ])
    );

    mockTransactionGet
      .mockResolvedValueOnce(
        docSnapshot(
          true,
          canonicalHandoff,
          handoffRef
        )
      )
      .mockResolvedValueOnce(
        docSnapshot(
          true,
          basket({
            status: 'ACTIVE',
          }),
          basketRef
        )
      );

    await expect(
      resolveCheckoutHandoff({
        idToken: 'valid-token',
        checkoutHandoffId: 'handoff_abc',
      })
    ).rejects.toThrow(
      'BASKET_NOT_CHECKOUT_READY'
    );

    expect(mockTransactionSet).not.toHaveBeenCalled();
  });

  it('does not expose displayed price as POS authority', async () => {
    const canonicalHandoff = handoff();

    mockQueryGet.mockResolvedValue(
      querySnapshot([
        docSnapshot(
          true,
          canonicalHandoff,
          handoffRef
        ),
      ])
    );

    mockTransactionGet
      .mockResolvedValueOnce(
        docSnapshot(
          true,
          canonicalHandoff,
          handoffRef
        )
      )
      .mockResolvedValueOnce(
        docSnapshot(
          true,
          basket(),
          basketRef
        )
      );

    const result = await resolveCheckoutHandoff({
      idToken: 'valid-token',
      checkoutHandoffId: 'handoff_abc',
    });

    expect(result.items[0]).toEqual({
      gtin: '06009188000332',
      quantity: 2,
      productName: 'Canonical Product',
    });

    expect(result.items[0]).not.toHaveProperty(
      'displayedUnitPrice'
    );
  });
});
