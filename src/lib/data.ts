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
    stores: ['Sandton City', 'Menlyn Park', 'Mall of Africa'],
  },
  {
    province: 'Western Cape',
    stores: ['V&A Waterfront', 'Canal Walk', 'Tyger Valley'],
  },
  {
    province: 'KwaZulu-Natal',
    stores: ['Gateway Theatre of Shopping', 'The Pavilion', 'Midlands Mall'],
  },
  {
    province: 'Eastern Cape',
    stores: ['Baywest Mall', 'Greenacres Shopping Centre'],
  },
  { province: 'Free State', stores: ['Loch Logan Waterfront'] },
  { province: 'Limpopo', stores: ['Mall of the North'] },
  { province: 'Mpumalanga', stores: ['I\'langa Mall'] },
  { province: 'North West', stores: ['Waterfall Mall'] },
  { province: 'Northern Cape', stores: ['Diamond Pavilion Mall'] },
];

const storeMetrics: Record<string, ReturnType<typeof generateRandomMetrics>> = {};
storesByRegion.flatMap(r => r.stores).forEach(store => {
  storeMetrics[store] = generateRandomMetrics();
});

export const dashboardMetrics = {
  getMetrics: (storeName?: string | null) => {
    if (!storeName || storeName === 'All Stores') {
      return allStoresMetrics;
    }
    return storeMetrics[storeName] || allStoresMetrics;
  },
};

export const roiMetrics = {
  gmroi: 18.5,
  basketUplift: 15.8,
  offerRedemptionRate: 22.4,
  engagementToConversion: 8.2,
};

export const salesData = [
  { name: 'Jan', revenue: 4000, scans: 240, crossSells: 120 },
  { name: 'Feb', revenue: 3000, scans: 139, crossSells: 98 },
  { name: 'Mar', revenue: 2000, scans: 980, crossSells: 450 },
  { name: 'Apr', revenue: 2780, scans: 390, crossSells: 210 },
  { name: 'May', revenue: 1890, scans: 480, crossSells: 250 },
  { name: 'Jun', revenue: 2390, scans: 380, crossSells: 190 },
];
