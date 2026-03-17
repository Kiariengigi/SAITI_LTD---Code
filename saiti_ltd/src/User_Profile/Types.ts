// types.ts

export interface Product {
  id: string;
  name: string;
  productId: string;
  price: number;
  stock: number;
  type: string;
}

export interface Supplier {
  name: string;
  role: string;
  location: string;
  fulfillmentRate: number;
  customerRating: number;
  memberSince: number;
}

export const SUPPLIER: Supplier = {
  name: "Saiti LTD",
  role: "Wholesaler",
  location: "Sigona, Kiambu Kenya",
  fulfillmentRate: 45,
  customerRating: 45,
  memberSince: 2026,
};

export const PRODUCTS: Product[] = Array.from({ length: 66 }, (_, i) => ({
  id: `prod-${i + 1}`,
  name: ["Steel Pipes 2in", "Cement 50kg", "Iron Rods 12mm", "Sand (1 tonne)", "Gravel Mix", "Timber 2x4"][i % 6],
  productId: `SKU-${String(1001 + i).padStart(5, "0")}`,
  price: [150, 850, 320, 1200, 900, 450][i % 6],
  stock: [15, 42, 88, 5, 30, 120][i % 6],
  type: ["Hardware", "Building Material", "Metal", "Aggregate", "Aggregate", "Timber"][i % 6],
}));

export const PAGE_SIZE = 6;