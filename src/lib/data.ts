

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
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
    image: 'https://picsum.photos/600/600',
    'data-ai-hint': 'water bottle',
  },
  {
    id: '2',
    name: 'Wireless Charging Pad',
    description: 'A sleek and fast wireless charging pad for all your compatible devices. Say goodbye to tangled cables.',
    category: 'Electronics',
    price: 45.0,
    image: 'https://picsum.photos/600/600',
    'data-ai-hint': 'charging pad',
  },
];

export const findProductById = (id: string | number) => {
  return products.find((p) => p.id === String(id));
};

const allStoresMetrics = {
  stats: {
    totalScans: 3150,
    uniqueScans: 1890,
    engagementRate: 75.3,
    dwellTime: 45,
    offerRedemption: 22.4,
    basketUplift: 15.8,
    conversionRate: 8.2,
    // Original metrics, kept for other parts of the app
    scanRate: 75.3,
    engagementDuration: 45,
    offerRedemptionRate: 22.4,
    avgBasketSizeAoe: 550,
    avgBasketSizeNonAoe: 450,
    basketUpliftPercentage: 22.2,
    totalRedeemedValue: 12345,
    aoeTransactions: 842,
    // New Financial Metrics for ROI page
    salesUplift: 84200,
    redemptionLinkedRevenue: 12345,
    costPerEngagement: 4.76,
    returnOnInvestment: 3.5,
  },
  topProducts: [
    { id: '1', name: 'Eco-Friendly Water Bottle', scans: 120, category: 'Lifestyle' },
    { id: '2', name: 'Wireless Charging Pad', scans: 98, category: 'Electronics' },
    { id: '3', name: 'Organic Cotton Tote Bag', scans: 85, category: 'Accessories' },
    { id: '4', name: 'Smart Fitness Tracker', scans: 72, category: 'Health' },
    { id: '5', name: 'Aromatherapy Diffuser', scans: 61, category: 'Home Goods' },
  ],
  timeBasedPerformance: [
    { time: 'Morning', engagement: 65, conversion: 15 },
    { time: 'Afternoon', engagement: 85, conversion: 25 },
    { time: 'Evening', engagement: 70, conversion: 20 },
    { time: 'Weekend', engagement: 95, conversion: 30 },
  ],
};

const generateRandomMetrics = () => ({
  stats: {
    totalScans: Math.floor(Math.random() * 500) + 50,
    uniqueScans: Math.floor(Math.random() * 300) + 30,
    scanRate: parseFloat((Math.random() * 30 + 50).toFixed(1)),
    engagementDuration: Math.floor(Math.random() * 30) + 20,
    offerRedemptionRate: parseFloat((Math.random() * 15 + 10).toFixed(1)),
    basketUplift: parseFloat((Math.random() * 10 + 5).toFixed(1)),
    // New metrics
    engagementRate: parseFloat((Math.random() * 30 + 50).toFixed(1)),
    dwellTime: Math.floor(Math.random() * 30) + 20,
    offerRedemption: parseFloat((Math.random() * 15 + 10).toFixed(1)),
    conversionRate: parseFloat((Math.random() * 5 + 5).toFixed(1)),
    // Performance & Conversion Metrics
    avgBasketSizeAoe: Math.floor(Math.random() * 100) + 500,
    avgBasketSizeNonAoe: Math.floor(Math.random() * 80) + 400,
    basketUpliftPercentage: parseFloat((Math.random() * 10 + 15).toFixed(1)),
    totalRedeemedValue: Math.floor(Math.random() * 5000) + 10000,
    aoeTransactions: Math.floor(Math.random() * 200) + 500,
    // New Financial Metrics for ROI page
    salesUplift: Math.floor(Math.random() * 20000) + 70000,
    redemptionLinkedRevenue: Math.floor(Math.random() * 5000) + 10000,
    costPerEngagement: parseFloat((Math.random() * 2 + 3).toFixed(2)),
    returnOnInvestment: parseFloat((Math.random() * 2 + 2).toFixed(1)),
  },
  topProducts: products
    .map(p => ({ ...p, scans: Math.floor(Math.random() * 50) + 10 }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 5),
  timeBasedPerformance: [
    { time: 'Morning', engagement: Math.floor(Math.random() * 40) + 40, conversion: Math.floor(Math.random() * 10) + 5 },
    { time: 'Afternoon', engagement: Math.floor(Math.random() * 40) + 50, conversion: Math.floor(Math.random() * 15) + 10 },
    { time: 'Evening', engagement: Math.floor(Math.random() * 40) + 45, conversion: Math.floor(Math.random() * 12) + 8 },
    { time: 'Weekend', engagement: Math.floor(Math.random() * 30) + 60, conversion: Math.floor(Math.random() * 20) + 15 },
  ],
});


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


const storeMetrics: Record<string, ReturnType<typeof generateRandomMetrics>> = {};
storesByRegion.flatMap(r => r.stores).forEach(store => {
  storeMetrics[store.name] = generateRandomMetrics();
});

export const dashboardMetrics = {
  getMetrics: (storeName?: string | null) => {
    if (!storeName || storeName === 'All Stores') {
      return allStoresMetrics;
    }
    return storeMetrics[storeName] || allStoresMetrics;
  },
};

const totalRevenueUplift = 42500;
const subscriptionCost = 15000;
const netGainLoss = totalRevenueUplift - subscriptionCost;
const revenueUpliftToCostRatio = parseFloat((totalRevenueUplift / subscriptionCost).toFixed(2));
const progressToBreakEven = Math.min(
  100,
  parseFloat(((totalRevenueUplift / subscriptionCost) * 100).toFixed(2))
);


export const roiMetrics = {
  gmroi: 18.5,
  basketUplift: 15.8,
  offerRedemptionRate: 22.4,
  engagementToConversion: 8.2,
  // New Executive Summary Metrics
  revenueUpliftToCostRatio: revenueUpliftToCostRatio,
  totalRevenueUplift: totalRevenueUplift,
  subscriptionCost: subscriptionCost,
  netGainLoss: netGainLoss,
  progressToBreakEven: progressToBreakEven,
};

export const salesData = [
  { name: 'Jan', revenue: 4000, scans: 240, crossSells: 120 },
  { name: 'Feb', revenue: 3000, scans: 139, crossSells: 98 },
  { name: 'Mar', revenue: 2000, scans: 980, crossSells: 450 },
  { name: 'Apr', revenue: 2780, scans: 390, crossSells: 210 },
  { name: 'May', revenue: 1890, scans: 480, crossSells: 250 },
  { name: 'Jun', revenue: 2390, scans: 380, crossSells: 190 },
];

export const revenueUpliftData = [
  { month: 'Jan', ratio: 1.8 },
  { month: 'Feb', ratio: 2.1 },
  { month: 'Mar', ratio: 2.5 },
  { month: 'Apr', ratio: 2.2 },
  { month: 'May', ratio: 2.6 },
  { month: 'Jun', ratio: 2.8 },
];

export const ytdData = [
    { month: 'Mar', revenue: 3200, cost: 1250, net: 1950 },
    { month: 'Apr', revenue: 3500, cost: 1250, net: 2250 },
    { month: 'May', revenue: 3800, cost: 1250, net: 2550 },
    { month: 'Jun', revenue: 4100, cost: 1250, net: 2850 },
    { month: 'Jul', revenue: 4500, cost: 1250, net: 3250 },
    { month: 'Aug', revenue: 4800, cost: 1250, net: 3550 },
    { month: 'Sep', revenue: 5200, cost: 1250, net: 3950 },
    { month: 'Oct', revenue: 5800, cost: 1250, net: 4550 },
    { month: 'Nov', revenue: 6500, cost: 1250, net: 5250 },
    { month: 'Dec', revenue: 8000, cost: 1250, net: 6750 },
    { month: 'Jan', revenue: 7500, cost: 1250, net: 6250 },
    { month: 'Feb', revenue: 7200, cost: 1250, net: 5950 },
];


export const realTimeStockLevels = [
  { id: '1', name: 'Eco-Friendly Water Bottle', stock: 120, status: 'In Stock' as const },
  { id: '2', name: 'Wireless Charging Pad', stock: 45, status: 'Low Stock' as const },
  { id: '3', name: 'Organic Cotton Tote Bag', stock: 0, status: 'Out of Stock' as const },
  { id: '4', name: 'Smart Fitness Tracker', stock: 80, status: 'In Stock' as const },
  { id: '5', name: 'Aromatherapy Diffuser', stock: 15, status: 'Low Stock' as const },
];

export const dataSyncLogs = [
  { id: '1', service: 'SAP S/4HANA', status: 'Success' as const, timestamp: '2023-10-27T10:00:00Z' },
  { id: '2', service: 'Salesforce Commerce Cloud', status: 'Success' as const, timestamp: '2023-10-27T09:45:00Z' },
  { id: '3', service: 'Oracle Fusion Cloud ERP', status: 'Failed' as const, timestamp: '2023-10-27T09:30:00Z' },
  { id: '4', service: 'Microsoft Dynamics 365', status: 'Success' as const, timestamp: '2023-10-27T09:15:00Z' },
];

export const moduleActivationLogs = [
  { id: '1', module: 'A/B Testing', action: 'Activated' as const, user: 'admin@interact.io', timestamp: '2023-10-26T14:00:00Z' },
  { id: '2', module: 'Retail Media Network', action: 'Deactivated' as const, user: 'admin@interact.io', timestamp: '2023-10-26T11:20:00Z' },
  { id: '3', module: 'Performance Analysis', action: 'Activated' as const, user: 'admin@interact.io', timestamp: '2023-10-25T09:05:00Z' },
];

export const scanFailuresLog = [
  { id: '1', store: 'Sandton City', location: 'Aisle 5, Shelf 3', error: 'Invalid QR Code', timestamp: '2023-10-27T10:05:00Z' },
  { id: '2', store: 'V&A Waterfront', location: 'Entrance Display', error: 'Network Timeout', timestamp: '2023-10-27T10:02:00Z' },
  { id: '3', store: 'Menlyn Park', location: 'Checkout 12', error: 'Product Not Found', timestamp: '2023-10-27T09:58:00Z' },
  { id: '4', store: 'Sandton City', location: 'Electronics Dept', error: 'Invalid QR Code', timestamp: '2023-10-27T09:55:00Z' },
];


export const systemUptime = {
  status: 'Operational',
  uptime: 99.99,
};

export const lastSyncStatus = {
  status: 'Success' as const,
  timestamp: '2023-10-27T10:00:00Z',
};

export const scanErrorRate = {
  rate: 0.1,
  failures: 5,
};

export const campaignModuleMetrics = {
  promoCardCtr: 4.8,
  aiAssistantUsageRate: 35,
  moduleEngagementSplit: {
    recommendations: 60,
    chatbot: 40,
  },
  timeToFirstInteraction: 12,
};

export const behavioralInsights = {
    repeatScansPerShopper: 2.3,
    redemptionFrequency: 45,
    topRedeemedOffers: [
        '10% off any Lifestyle item',
        'Buy one, get one free on Tote Bags',
        'R50 off your next purchase',
    ],
    customerSegmentation: {
        highValue: 15,
        loyal: 40,
        atRisk: 25,
    },
};

export const staffActivationData = [
  { id: '1', name: 'Thabo Ndlovu', store: 'Sandton City', activations: 125 },
  { id: '2', name: 'Sarah Miller', store: 'V&A Waterfront', activations: 110 },
  { id: '3', name: 'John Smith', store: 'Gateway Theatre of Shopping', activations: 95 },
  { id: '4', name: 'Naledi Williams', store: 'Menlyn Park', activations: 80 },
  { id: '5', name: 'David Chen', store: 'Canal Walk', activations: 72 },
];
