export type ShopperProduct = {
  gtin: string;
  retailerId: string;
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
