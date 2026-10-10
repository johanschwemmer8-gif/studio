jest.mock('genkit', () => ({
  z: {
    string: () => ({
      min: () => ({}),
      url: () => ({}),
    }),
    number: () => ({}),
    boolean: () => ({}),
    array: () => ({}),
    object: () => ({}),
  },
}));

jest.mock('@/lib/firebase-admin', () => {
  const commit = jest.fn().mockResolvedValue(undefined);
  const set = jest.fn();

  return {
    admin: {
      apps: [{}],
      firestore: Object.assign(
        jest.fn(() => ({
          batch: () => ({
            set,
            commit,
          }),
          collection: () => ({
            doc: (id: string) => ({ id }),
          }),
        })),
        {
          FieldValue: {
            serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
          },
        }
      ),
    },
  };
});

jest.mock('@/lib/auth-server', () => ({
  getAuthorizedRetailerId: jest.fn(),
}));

jest.mock('@/ai/genkit', () => ({
  ai: {
    defineFlow: (_config: unknown, handler: unknown) => handler,
  },
}));

import { getAuthorizedRetailerId } from '@/lib/auth-server';
import { syncProducts } from './sync-products';

const mockedGetAuthorizedRetailerId =
  getAuthorizedRetailerId as jest.MockedFunction<typeof getAuthorizedRetailerId>;

describe('syncProducts authorization boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('authorizes the requested retailer before performing product sync', async () => {
    mockedGetAuthorizedRetailerId.mockResolvedValue('retailer-a');

    const result = await syncProducts({
      idToken: 'valid-token',
      retailerId: 'retailer-a',
      products: [],
    });

    expect(mockedGetAuthorizedRetailerId).toHaveBeenCalledWith(
      'valid-token',
      'retailer-a'
    );
    expect(result).toEqual({
      success: true,
      syncedCount: 0,
    });
  });

  test('fails closed when the requested retailer is not authorized', async () => {
    mockedGetAuthorizedRetailerId.mockRejectedValue(
      new Error('Retailer access denied.')
    );

    await expect(
      syncProducts({
        idToken: 'valid-token',
        retailerId: 'retailer-b',
        products: [],
      })
    ).rejects.toThrow('Retailer access denied.');
  });
});
