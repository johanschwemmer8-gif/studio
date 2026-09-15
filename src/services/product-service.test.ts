import { updateCanonicalProduct } from './product-service';
import { verifyAuth } from '@/lib/auth-server';
import { getDb, admin } from '@/lib/firebase-admin';

jest.mock('@/lib/auth-server', () => ({
  verifyAuth: jest.fn(),
}));

jest.mock('@/lib/firebase-admin', () => ({
  admin: {
    firestore: {
      Timestamp: {
        now: jest.fn(),
      },
    },
  },
  getDb: jest.fn(),
}));

const mockVerifyAuth = verifyAuth as jest.Mock;
const mockGetDb = getDb as jest.Mock;
const mockTimestampNow = admin.firestore.Timestamp.now as jest.Mock;

const baseInput = {
  firestoreId: '06001234567890',
  retailerId: 'retailer-1',
  retailerSku: 'SKU-1',
  barcode: '6001234567890',
  name: 'Test Product',
  brand: 'Test Brand',
  description: 'Test description',
  department: 'Grocery',
  category: 'Beverages',
  subcategory: 'Soft Drinks',
  price: 19.99,
  promotionalPrice: 17.99,
  currency: 'ZAR',
  imageUrl: 'https://example.com/product.jpg',
};

const authorizedActor = {
  uid: 'user-123',
  retailerId: 'retailer-1',
  role: 'networkAdmin',
  scope: {
    level: 'network',
    networkId: 'network-1',
  },
  permissions: {},
  isActive: true,
};

function mockProductDocument(
  existingData: Record<string, unknown> | null = {
    productId: 'prod-123',
    retailerId: 'retailer-1',
    gtin: '06001234567890',
    source: 'MANUAL',
    createdAt: 'original-created-at',
    createdBy: 'original-creator',
    gs1: { validationStatus: 'VALID' },
    name: 'Old Product',
    category: 'Old Category',
    price: 10,
    currency: 'ZAR',
  }
) {
  const update = jest.fn().mockResolvedValue(undefined);
  const get = jest.fn().mockResolvedValue({
    exists: existingData !== null,
    data: () => existingData ?? undefined,
  });
  const doc = jest.fn(() => ({ get, update }));
  const collection = jest.fn(() => ({ doc }));

  mockGetDb.mockReturnValue({ collection });

  return { update, get, doc, collection };
}

describe('updateCanonicalProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTimestampNow.mockReturnValue('updated-at');
    mockVerifyAuth.mockResolvedValue(authorizedActor);
  });

  test('rejects a missing authentication token', async () => {
    const result = await updateCanonicalProduct(baseInput, '');

    expect(result).toEqual({
      success: false,
      error: 'Authentication required.',
    });
    expect(mockVerifyAuth).not.toHaveBeenCalled();
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('fails closed when authoritative authentication fails', async () => {
    mockVerifyAuth.mockResolvedValue({
      uid: '',
      error: 'Authentication failed.',
    });

    const result = await updateCanonicalProduct(baseInput, 'bad-token');

    expect(result).toEqual({
      success: false,
      error: 'Authentication failed.',
    });
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('rejects a caller retailer mismatch before loading the product', async () => {
    const result = await updateCanonicalProduct(
      { ...baseInput, retailerId: 'retailer-2' },
      'valid-token'
    );

    expect(result).toEqual({
      success: false,
      error: 'Access denied: retailer identity does not match your account.',
    });
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('rejects a missing product', async () => {
    mockProductDocument(null);

    const result = await updateCanonicalProduct(baseInput, 'valid-token');

    expect(result).toEqual({
      success: false,
      error: 'Product was not found.',
    });
  });

  test('rejects a stored product belonging to another retailer', async () => {
    const firestore = mockProductDocument({
      productId: 'prod-other',
      retailerId: 'retailer-2',
      gtin: '06001234567890',
    });

    const result = await updateCanonicalProduct(baseInput, 'valid-token');

    expect(result).toEqual({
      success: false,
      error: 'Access denied: product is outside your retailer catalog.',
    });
    expect(firestore.update).not.toHaveBeenCalled();
  });

  test.each([
    [{ price: -1 }, 'Product price must be a valid number greater than or equal to zero.'],
    [{ price: Number.NaN }, 'Product price must be a valid number greater than or equal to zero.'],
    [{ currency: 'ZA' }, 'Currency must be a valid three-letter ISO currency code.'],
    [{ promotionalPrice: -1 }, 'Promotional price must be a valid number greater than or equal to zero.'],
  ])('rejects invalid mutable product data %p', async (overrides, expectedError) => {
    const result = await updateCanonicalProduct(
      { ...baseInput, ...overrides },
      'valid-token'
    );

    expect(result).toEqual({
      success: false,
      error: expectedError,
    });
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  test('updates only mutable canonical retailer fields and preserves identity/provenance', async () => {
    const existing = {
      productId: 'prod-123',
      retailerId: 'retailer-1',
      gtin: '06001234567890',
      source: 'MANUAL',
      createdAt: 'original-created-at',
      createdBy: 'original-creator',
      gs1: { validationStatus: 'VALID' },
      name: 'Old Product',
      category: 'Old Category',
      price: 10,
      currency: 'ZAR',
    };
    const firestore = mockProductDocument(existing);

    const result = await updateCanonicalProduct(baseInput, 'valid-token');

    expect(firestore.collection).toHaveBeenCalledWith('products');
    expect(firestore.doc).toHaveBeenCalledWith(baseInput.firestoreId);
    expect(firestore.update).toHaveBeenCalledTimes(1);

    const written = firestore.update.mock.calls[0][0];

    expect(written).toEqual({
      name: 'Test Product',
      category: 'Beverages',
      price: 19.99,
      currency: 'ZAR',
      retailerSku: 'SKU-1',
      barcode: '6001234567890',
      brand: 'Test Brand',
      description: 'Test description',
      subcategory: 'Soft Drinks',
      department: 'Grocery',
      imageUrl: 'https://example.com/product.jpg',
      promotionalPrice: 17.99,
      updatedAt: 'updated-at',
      updatedBy: 'user-123',
    });

    for (const immutableField of [
      'productId',
      'retailerId',
      'gtin',
      'source',
      'createdAt',
      'createdBy',
      'gs1',
    ]) {
      expect(written).not.toHaveProperty(immutableField);
    }

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.product).toMatchObject({
        productId: 'prod-123',
        retailerId: 'retailer-1',
        gtin: '06001234567890',
        source: 'MANUAL',
        createdAt: 'original-created-at',
        createdBy: 'original-creator',
        gs1: { validationStatus: 'VALID' },
        updatedBy: 'user-123',
      });
    }
  });

  test('clears optional mutable fields without changing product identity', async () => {
    const firestore = mockProductDocument();

    const result = await updateCanonicalProduct(
      {
        firestoreId: baseInput.firestoreId,
        retailerId: baseInput.retailerId,
        name: 'Test Product',
        category: 'Beverages',
        price: 20,
        currency: 'zar',
      },
      'valid-token'
    );

    expect(result.success).toBe(true);

    const written = firestore.update.mock.calls[0][0];
    expect(written).toMatchObject({
      currency: 'ZAR',
      retailerSku: null,
      barcode: null,
      brand: null,
      description: null,
      subcategory: null,
      department: null,
      imageUrl: null,
      promotionalPrice: null,
      updatedBy: 'user-123',
    });
    expect(written).not.toHaveProperty('gtin');
    expect(written).not.toHaveProperty('productId');
    expect(written).not.toHaveProperty('retailerId');
  });
});
