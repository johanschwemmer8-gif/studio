
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
export const revenueUpliftData: { month: string; ratio: number; }[] = [];
export const ytdData: { month: string; revenue: number; cost: number; net: number; }[] = [];
export const realTimeStockLevels = [
    { id: 'prod-001', name: 'Eco-Friendly Water Bottle', stock: 152, status: 'In Stock' as const },
    { id: 'prod-002', name: 'Wireless Charging Pad', stock: 48, status: 'Low Stock' as const },
    { id: 'prod-003', name: 'Smart Notebook', stock: 0, status: 'Out of Stock' as const },
    { id: 'prod-004', name: 'Canvas Tote Bag', stock: 210, status: 'In Stock' as const },
];
export const dataSyncLogs: { id: string; service: string; status: 'Success' | 'Failed'; timestamp: string; }[] = [];
export const moduleActivationLogs: { id: string; module: string; action: 'Activated' | 'Deactivated'; user: string; timestamp: string; }[] = [];
export const scanFailuresLog: { id: string; store: string; location: string; error: string; timestamp: string; }[] = [];

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
