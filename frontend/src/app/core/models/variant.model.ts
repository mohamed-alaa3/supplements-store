export interface ProductVariant {
  _id: string;
  product: string;
  sku: string;
  nameAr?: string;
  nameEn?: string;
  flavor?: string;
  sizeLabel?: string;
  servings?: number;
  price: number;
  compareAtPrice?: number;
  barcode?: string;
  weightGrams?: number;
  isDefault: boolean;
  isActive: boolean;
  /** Present when the endpoint joins inventory (e.g. product detail page). */
  stockState?: import("./product.model").StockState;
  availableQuantity?: number;
}

export type VariantPayload = Omit<ProductVariant, "_id" | "product" | "stockState" | "availableQuantity">;
