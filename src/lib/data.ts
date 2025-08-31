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

export const dashboardMetrics = {
  salesPerformance: [
    { name: 'Jan', revenue: 10000, scans: 400, crossSells: 150 },
    { name: 'Feb', revenue: 9500, scans: 300, crossSells: 120 },
    { name: 'Mar', revenue: 12000, scans: 500, crossSells: 200 },
    { name: 'Apr', revenue: 11000, scans: 450, crossSells: 180 },
    { name: 'May', revenue: 13000, scans: 600, crossSells: 250 },
    { name: 'Jun', revenue: 15000, scans: 800, crossSells: 300 },
  ],
  scanFrequency: [
    { name: 'Jan', scans: 400 },
    { name: 'Feb', scans: 300 },
    { name: 'Mar', scans: 500 },
    { name: 'Apr', scans: 450 },
    { name: 'May', scans: 600 },
    { name: 'Jun', scans: 800 },
  ],
  topProducts: [
    { id: '1', name: 'Eco-Friendly Water Bottle', scans: 120, category: 'Lifestyle' },
    { id: '2', name: 'Wireless Charging Pad', scans: 98, category: 'Electronics' },
    { id: '3', name: 'Organic Cotton Tote Bag', scans: 85, category: 'Accessories' },
    { id: '4', name: 'Smart Fitness Tracker', scans: 72, category: 'Health' },
    { id: '5', name: 'Aromatherapy Diffuser', scans: 61, category: 'Home Goods' },
  ],
  stats: {
    totalScans: 3150,
    uniqueProducts: 42,
    recommendationCTR: 18.2,
    customerConversionRate: 12.5,
    qrCodeScanRate: 75.3,
  },
};

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
