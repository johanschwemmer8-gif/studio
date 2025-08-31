
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
    scanRate: 75.3,
    engagementDuration: 45,
    offerRedemptionRate: 22.4,
    basketUplift: 15.8,
    // Performance & Conversion Metrics
    avgBasketSizeAoe: 550,
    avgBasketSizeNonAoe: 450,
    basketUpliftPercentage: 22.2,
    totalRedeemedValue: 12345,
    aoeTransactions: 842,
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
    // Performance & Conversion Metrics
    avgBasketSizeAoe: Math.floor(Math.random() * 100) + 500,
    avgBasketSizeNonAoe: Math.floor(Math.random() * 80) + 400,
    basketUpliftPercentage: parseFloat((Math.random() * 10 + 15).toFixed(1)),
    totalRedeemedValue: Math.floor(Math.random() * 5000) + 10000,
    aoeTransactions: Math.floor(Math.random() * 200) + 500,
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

export let retailPortfolio = [
  {
    brand: 'iNteract Retail',
    regions: [
      {
        name: 'Gauteng',
        areas: [
          {
            name: 'Johannesburg North',
            stores: [
              { name: 'Sandton City', code: 1001 },
              { name: 'Mall of Africa', code: 1003 },
            ],
          },
          {
            name: 'Pretoria',
            stores: [{ name: 'Menlyn Park', code: 1002 }],
          },
        ],
      },
      {
        name: 'Western Cape',
        areas: [
          {
            name: 'Cape Town City Bowl',
            stores: [{ name: 'V&A Waterfront', code: 2001 }],
          },
          {
            name: 'Century City',
            stores: [{ name: 'Canal Walk', code: 2002 }],
          },
          {
            name: 'Northern Suburbs',
            stores: [{ name: 'Tyger Valley', code: 2003 }],
          },
        ],
      },
       {
        name: 'KwaZulu-Natal',
        areas: [
          {
            name: 'Durban',
            stores: [
              { name: 'Gateway Theatre of Shopping', code: 3001 },
              { name: 'The Pavilion', code: 3002 },
            ],
          },
           {
            name: 'Pietermaritzburg',
            stores: [{ name: 'Midlands Mall', code: 3003 }],
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

export const systemUptime = {
  status: 'Operational',
  uptime: 99.99,
};
