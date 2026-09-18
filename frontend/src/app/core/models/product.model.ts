export type ProductType =
  | "supplement" | "protein" | "vitamin" | "mineral" | "preworkout"
  | "amino" | "hydration" | "snack" | "equipment" | "bundle";

export type DiscountType = "none" | "percentage" | "fixed";

export interface Product {
  _id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  shortDescriptionAr?: string;
  shortDescriptionEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  seller: string; // SellerProfile id (may arrive populated — see ProductPopulated)
  brand?: string | null;
  category: string;
  productType: ProductType;
  basePrice: number;
  compareAtPrice?: number;
  discountType: DiscountType;
  discountValue: number;
  ratingAverage: number;
  reviewCount: number;
  tags: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape returned by list/detail endpoints once the backend populates refs
 * (brand/category/seller as objects, plus computed stock summary and
 * primary image). Frontend should only rely on fields the backend brief
 * documents; anything else here is defensive/optional.
 */
export interface ProductListItem extends Omit<Product, "brand" | "category"> {
  brand?: { _id: string; name: string; slug: string } | string | null;
  category?:
    | { _id: string; nameAr: string; nameEn: string; slug: string }
    | string;
  primaryImageUrl?: string;
  priceFrom?: number;
  stockState?: StockState;
}

export type StockState = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductQueryParams {
  search?: string;
  category?: string;
  brand?: string;
  seller?: string;
  productType?: ProductType;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  featured?: boolean;
  bestSeller?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "rating" | "popularity";
  page?: number;
  limit?: number;
}

export interface ProductPayload {
  nameAr: string;
  nameEn: string;
  shortDescriptionAr?: string;
  shortDescriptionEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  brand?: string;
  category: string;
  productType: ProductType;
  basePrice: number;
  compareAtPrice?: number;
  discountType?: DiscountType;
  discountValue?: number;
  tags?: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
}
