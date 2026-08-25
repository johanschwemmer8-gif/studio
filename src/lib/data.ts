
import placeholderImages from '@/app/lib/placeholder-images.json';

/**
 * ARCHITECTURAL RULE (IDENTITY LAYER):
 * The Product type is the canonical representation of a GS1-aligned item.
 * It MUST use GTIN-14 as the only unique identifier. 
 * Arbitrary internal IDs are strictly forbidden.
 */
export type Product = {
  gtin: string; // GS1 Global Trade Item Number (Mandatory Primary Key)
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

/**
 * TEST FIXTURES: Mathematically Verified GS1 Identifiers
 */
export const products: Product[] = [
  {
    gtin: '06009188000332', 
    name: 'Estate Reserve Pinotage',
    brand: 'Heritage Vineyards',
    description:
      'Our flagship red. Bold, complex, and aged for 18 months in French oak. Notes of dark chocolate and roasted coffee. Best served at 16-18°C.',
    category: 'Red Wine',
    price: 350.0,
    image: placeholderImages.products['water-bottle'],
    'data-ai-hint': 'red wine',
  },
  {
    gtin: '00012345678905', 
    name: 'Wireless Charging Pad',
    brand: 'LifeTech',
    description: 'A sleek and fast wireless charging pad for all your compatible devices. Say goodbye to tangled cables.',
    category: 'Electronics',
    price: 45.0,
    image: placeholderImages.products['charging-pad'],
    'data-ai-hint': 'charging pad',
  },
];

export const findProductByGtin = (gtin: string) => {
  return products.find((p) => p.gtin === gtin);
};

export const findProductById = (id: string | number) => {
    return products.find((p) => p.gtin === String(id).padStart(14, '0'));
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

export const systemUptime = {
  uptime: 99.9,
  status: 'Operational' as const,
};

export const realTimeStockLevels = [
  { id: '1', name: 'Estate Reserve Pinotage', stock: 45, status: 'In Stock' as const },
  { id: '2', name: 'Coastal White Blend', stock: 12, status: 'Low Stock' as const },
  { id: '3', name: 'Vintage Brut', stock: 0, status: 'Out of Stock' as const },
  { id: '4', name: 'Aged Cabernet Sauvignon', stock: 88, status: 'In Stock' as const },
];

export const dataSyncLogs = [
  { id: '1', service: 'ERP Inventory Sync', status: 'Success' as const, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', service: 'PIM Product Update', status: 'Success' as const, timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', service: 'POS Transaction Bridge', status: 'Failed' as const, timestamp: new Date(Date.now() - 10800000).toISOString() },
];

export const scanFailuresLog = [
  { id: '1', store: 'Sandton City', location: 'Wine Aisle 4', error: 'Low Lighting', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', store: 'V&A Waterfront', location: 'End-cap Display', error: 'Damaged QR', timestamp: new Date(Date.now() - 5400000).toISOString() },
  { id: '3', store: 'Menlyn Park', location: 'Entrance Kiosk', error: 'Network Timeout', timestamp: new Date(Date.now() - 9000000).toISOString() },
];

export const moduleActivationLogs = [
  { id: '1', module: 'Ari AI Recommendations', action: 'Activated' as const, user: 'admin@interact.io', timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', module: 'A/B Testing Engine', action: 'Activated' as const, user: 'johan@interact.io', timestamp: new Date(Date.now() - 172800000).toISOString() },
];

export const campaignModuleMetrics = {
  promoCardCtr: 8.4,
  aiAssistantUsageRate: 32.1,
  moduleEngagementSplit: {
    recommendations: 65,
    chatbot: 35,
  },
  timeToFirstInteraction: 12,
};

export const behavioralInsights = {
  repeatScansPerShopper: 2.4,
  redemptionFrequency: 14,
  topRedeemedOffers: ['15% Wine Discount', 'Free Decanter cleaning kit', 'Bulk Buy 6+ 10% Off'],
  customerSegmentation: {
    highValue: 15,
    loyal: 45,
    atRisk: 40,
  },
};

export const staffActivationData = [
  { id: '1', name: 'Sarah Jenkins', store: 'Sandton City', activations: 142 },
  { id: '2', name: 'Mike Thompson', store: 'V&A Waterfront', activations: 128 },
  { id: '3', name: 'Busi Mtshali', store: 'Menlyn Park', activations: 115 },
  { id: '4', name: 'Kevin Naidoo', store: 'Gateway', activations: 94 },
];
