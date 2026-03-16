
import placeholderImages from '@/app/lib/placeholder-images.json';

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: {
    src: string;
    width: number;
    height: number;
  };
  'data-ai-hint': string;
};

export const products: Product[] = [
  {
    id: '1',
    name: 'Eco-Friendly Water Bottle',
    description:
      'Stay hydrated on the go with our reusable and eco-friendly water bottle. Made from durable stainless steel, it keeps your drinks cold for 24 hours or hot for 12.',
    category: 'Lifestyle',
    price: 25.0,
    image: placeholderImages.products['water-bottle'],
    'data-ai-hint': placeholderImages.products['water-bottle'].ai_hint,
  },
  {
    id: '2',
    name: 'Wireless Charging Pad',
    description: 'A sleek and fast wireless charging pad for all your compatible devices. Say goodbye to tangled cables.',
    category: 'Electronics',
    price: 45.0,
    image: placeholderImages.products['charging-pad'],
    'data-ai-hint': placeholderImages.products['charging-pad'].ai_hint,
  },
];

export const findProductById = (id: string | number) => {
  return products.find((p) => p.id === String(id));
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
  {
    province: 'Eastern Cape',
    stores: [
      { name: 'Baywest Mall', code: 4001 },
      { name: 'Greenacres Shopping Centre', code: 4002 },
    ],
  },
  { province: 'Free State', stores: [{ name: 'Loch Logan Waterfront', code: 5001 }] },
  { province: 'Limpopo', stores: [{ name: 'Mall of the North', code: 6001 }] },
  { province: 'Mpumalanga', stores: [{ name: 'I\'langa Mall', code: 7001 }] },
  { province: 'North West', stores: [{ name: 'Waterfall Mall', code: 8001 }] },
  { province: 'Northern Cape', stores: [{ name: 'Diamond Pavilion Mall', code: 9001 }] },
];

export type Store = {
  name: string;
  code: number;
  address: string;
  contact: string;
};

export type Area = {
  name: string;
  stores: Store[];
};

export type Region = {
  name: string;
  areas: Area[];
};

export type Brand = {
  brand: string;
  regions: Region[];
};

export type RetailPortfolio = Brand[];


export let retailPortfolio: RetailPortfolio = [
  {
    brand: 'iNteract Retail',
    regions: [
      {
        name: 'Gauteng',
        areas: [
          {
            name: 'Johannesburg North',
            stores: [
              { name: 'Sandton City', code: 1001, address: '83 Rivonia Rd, Sandhurst, Sandton, 2196', contact: '011 217 6000' },
              { name: 'Mall of Africa', code: 1003, address: 'Lone Creek Cres, Waterval City, Midrand, 1686', contact: '010 596 1470' },
            ],
          },
          {
            name: 'Pretoria',
            stores: [{ name: 'Menlyn Park', code: 1002, address: 'Cnr Atterbury Road & Lois Avenue, Menlo Park, Pretoria, 0063', contact: '012 764 9600' }],
          },
        ],
      },
      {
        name: 'Western Cape',
        areas: [
          {
            name: 'Cape Town City Bowl',
            stores: [{ name: 'V&A Waterfront', code: 2001, address: '19 Dock Rd, Cape Town, 8001', contact: '021 408 7600' }],
          },
          {
            name: 'Century City',
            stores: [{ name: 'Canal Walk', code: 2002, address: 'Canal Walk, Century Blvd, Century City, Cape Town, 7441', contact: '021 529 9600' }],
          },
          {
            name: 'Northern Suburbs',
            stores: [{ name: 'Tyger Valley', code: 2003, address: 'Cnr of Bill Bezuidenhout & Willie van Schoor, Bellville Park, Cape Town, 7530', contact: '021 914 1822' }],
          },
        ],
      },
       {
        name: 'KwaZulu-Natal',
        areas: [
          {
            name: 'Durban',
            stores: [
              { name: 'Gateway Theatre of Shopping', code: 3001, address: '1 Palm Blvd, Umhlanga Ridge, Umhlanga, 4319', contact: '031 514 0500' },
              { name: 'The Pavilion', code: 3002, address: '5 Jack Martens Dr, Westville, Durban, 3629', contact: '031 275 9800' },
            ],
          },
           {
            name: 'Pietermaritzburg',
            stores: [{ name: 'Midlands Mall', code: 3003, address: '50 Sanctuary Rd, Chase Valley, Pietermaritzburg, 3201', contact: '033 341 9570' }],
          },
        ],
      },
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
export const revenueUpliftData = [
    { month: 'Mar', ratio: 2.1 },
    { month: 'Apr', ratio: 2.5 },
    { month: 'May', ratio: 2.3 },
    { month: 'Jun', ratio: 2.8 },
    { month: 'Jul', ratio: 3.1 },
    { month: 'Aug', ratio: 3.4 },
];
export const ytdData = [
    { month: 'Mar', revenue: 23000, cost: 5000, net: 18000 },
    { month: 'Apr', revenue: 29000, cost: 5000, net: 24000 },
    { month: 'May', revenue: 25000, cost: 5000, net: 20000 },
    { month: 'Jun', revenue: 31000, cost: 5000, net: 26000 },
    { month: 'Jul', revenue: 34000, cost: 5000, net: 29000 },
    { month: 'Aug', revenue: 38000, cost: 5000, net: 33000 },
];
export const realTimeStockLevels = [
    { id: 'prod-001', name: 'Eco-Friendly Water Bottle', stock: 152, status: 'In Stock' as const },
    { id: 'prod-002', name: 'Wireless Charging Pad', stock: 48, status: 'Low Stock' as const },
    { id: 'prod-003', name: 'Smart Notebook', stock: 0, status: 'Out of Stock' as const },
    { id: 'prod-004', name: 'Canvas Tote Bag', stock: 210, status: 'In Stock' as const },
];
export const dataSyncLogs: { id: string; service: string; status: 'Success' | 'Failed'; timestamp: string; }[] = [
  { id: 'sync-001', service: 'ERP Stock Levels', status: 'Success' as const, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: 'sync-002', service: 'PIM Product Details', status: 'Success' as const, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: 'sync-003', service: 'Salesforce CRM', status: 'Failed' as const, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
];
export const moduleActivationLogs: { id: string; module: string; action: 'Activated' | 'Deactivated'; user: string; timestamp: string; }[] = [
    { id: 'act-001', module: 'A/B Testing', action: 'Activated' as const, user: 'j.doe@example.com', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'act-002', module: 'Retail Media Network', action: 'Activated' as const, user: 's.smith@example.com', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'act-003', module: 'AI Chatbot', action: 'Deactivated' as const, user: 'j.doe@example.com', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];
export const scanFailuresLog: { id: string; store: string; location: string; error: string; timestamp: string; }[] = [
    { id: 'fail-001', store: 'Sandton City', location: 'Aisle 5', error: 'Invalid QR Code', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
    { id: 'fail-002', store: 'V&A Waterfront', location: 'Checkout', error: 'Product Not Found', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { id: 'fail-003', store: 'Menlyn Park', location: 'Entrance', error: 'Expired Campaign', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
];

export const systemUptime = {
  status: 'Operational',
  uptime: 100.0,
};

export const lastSyncStatus = {
  status: 'Success' as const,
  timestamp: new Date().toISOString(),
};

export const scanErrorRate = {
  rate: 0.0,
  failures: 0,
};

export const campaignModuleMetrics = {
  promoCardCtr: 12.5,
  aiAssistantUsageRate: 34.2,
  moduleEngagementSplit: {
    recommendations: 65,
    chatbot: 35,
  },
  timeToFirstInteraction: 18,
};

export const behavioralInsights = {
    repeatScansPerShopper: 2.8,
    redemptionFrequency: 14,
    topRedeemedOffers: [
        '15% Off Your Next Purchase',
        'Buy One Get One Free on Coffee',
        'R50 Off Winter Jackets',
    ],
    customerSegmentation: {
        highValue: 22,
        loyal: 41,
        atRisk: 18,
    },
};

export const staffActivationData = [
  { id: 'staff-01', name: 'Thabo Ndlovu', store: 'Sandton City', activations: 128 },
  { id: 'staff-02', name: 'Anika Patel', store: 'Gateway', activations: 112 },
  { id: 'staff-03', name: 'John Smith', store: 'V&A Waterfront', activations: 98 },
  { id: 'staff-04', name: 'Emily Williams', store: 'Sandton City', activations: 85 },
];

export const hourlyPerformanceData = [
  { time: '8am', uniqueScans: 50, engagementRate: 4.1, offerRedemption: 15.2, basketUplift: 8.1, conversionRate: 20.5, dwellTime: 25 },
  { time: '9am', uniqueScans: 120, engagementRate: 4.5, offerRedemption: 16.0, basketUplift: 9.2, conversionRate: 22.1, dwellTime: 28 },
  { time: '10am', uniqueScans: 180, engagementRate: 5.1, offerRedemption: 17.5, basketUplift: 10.5, conversionRate: 24.3, dwellTime: 31 },
  { time: '11am', uniqueScans: 250, engagementRate: 5.8, offerRedemption: 18.2, basketUplift: 11.8, conversionRate: 25.0, dwellTime: 33 },
  { time: '12pm', uniqueScans: 300, engagementRate: 6.2, offerRedemption: 19.1, basketUplift: 12.5, conversionRate: 26.1, dwellTime: 35 },
  { time: '1pm', uniqueScans: 320, engagementRate: 6.5, offerRedemption: 20.0, basketUplift: 13.1, conversionRate: 27.2, dwellTime: 36 },
  { time: '2pm', uniqueScans: 280, engagementRate: 6.1, offerRedemption: 19.5, basketUplift: 12.8, conversionRate: 26.8, dwellTime: 34 },
  { time: '3pm', uniqueScans: 260, engagementRate: 5.9, offerRedemption: 18.8, basketUplift: 12.1, conversionRate: 25.5, dwellTime: 32 },
  { time: '4pm', uniqueScans: 220, engagementRate: 5.5, offerRedemption: 18.0, basketUplift: 11.2, conversionRate: 24.0, dwellTime: 30 },
  { time: '5pm', uniqueScans: 190, engagementRate: 5.2, offerRedemption: 17.1, basketUplift: 10.1, conversionRate: 23.1, dwellTime: 29 },
];
