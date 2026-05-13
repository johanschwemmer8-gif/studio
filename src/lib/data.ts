
import placeholderImages from '@/app/lib/placeholder-images.json';

export type Product = {
  gtin: string; // GS1 Global Trade Item Number
  name: string;
  brand: string;
  description: string;
  category: string;
  price: number;
  image: {
    src: string;
    width: number;
    height: number;
  };
  'data-ai-hint': string;
  batchNumber?: string;
  serialNumber?: string;
};

export const products: Product[] = [
  {
    gtin: '06001234567891', // Standard GS1 GTIN-14
    name: 'Eco-Friendly Water Bottle',
    brand: 'HydroCool',
    description:
      'Stay hydrated on the go with our reusable and eco-friendly water bottle. Made from durable stainless steel, it keeps your drinks cold for 24 hours or hot for 12.',
    category: 'Lifestyle',
    price: 25.0,
    image: placeholderImages.products['water-bottle'],
    'data-ai-hint': placeholderImages.products['water-bottle'].ai_hint,
  },
  {
    gtin: '06009876543210', // Standard GS1 GTIN-14
    name: 'Wireless Charging Pad',
    brand: 'LifeTech',
    description: 'A sleek and fast wireless charging pad for all your compatible devices. Say goodbye to tangled cables.',
    category: 'Electronics',
    price: 45.0,
    image: placeholderImages.products['charging-pad'],
    'data-ai-hint': placeholderImages.products['charging-pad'].ai_hint,
  },
];

export const findProductByGtin = (gtin: string) => {
  return products.find((p) => p.gtin === gtin);
};

// Legacy support: Internal IDs now map to GTINs for continuity
export const findProductById = (id: string | number) => {
    if (id === '1') return products[0];
    if (id === '2') return products[1];
    return products.find((p) => p.gtin === String(id));
};

export const storesByRegion = [
  {
    province: 'Gauteng',
    stores: [
      { name: 'Sandton City', code: 1001 },
      { name: 'Menlyn Park', code: 1002 },
      { name: 'Mall of Africa', code: 1003 },
    ],
  },
  {
    province: 'Western Cape',
    stores: [
      { name: 'V&A Waterfront', code: 2001 },
      { name: 'Canal Walk', code: 2002 },
      { name: 'Tyger Valley', code: 2003 },
    ],
  },
  {
    province: 'KwaZulu-Natal',
    stores: [
      { name: 'Gateway Theatre of Shopping', code: 3001 },
      { name: 'The Pavilion', code: 3002 },
      { name: 'Midlands Mall', code: 3003 },
    ],
  },
];

export const salesData = [
  { name: 'Mar', revenue: 23000, scans: 980, crossSells: 320 },
  { name: 'Apr', revenue: 29000, scans: 1100, crossSells: 400 },
  { name: 'May', revenue: 25000, scans: 1050, crossSells: 380 },
  { name: 'Jun', revenue: 31000, scans: 1240, crossSells: 450 },
  { name: 'Jul', revenue: 34000, scans: 1300, crossSells: 480 },
  { name: 'Aug', revenue: 38000, scans: 1450, crossSells: 520 },
];

export const hourlyPerformanceData = [
  { time: '8am', uniqueScans: 50, engagementRate: 4.1, offerRedemption: 15.2, basketUplift: 8.1, conversionRate: 20.5, dwellTime: 25 },
  { time: '9am', uniqueScans: 120, engagementRate: 4.5, offerRedemption: 16.0, basketUplift: 9.2, conversionRate: 22.1, dwellTime: 28 },
  { time: '10am', uniqueScans: 180, engagementRate: 5.1, offerRedemption: 17.5, basketUplift: 10.5, conversionRate: 24.3, dwellTime: 31 },
];
