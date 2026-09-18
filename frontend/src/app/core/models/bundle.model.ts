export type BundleType = "fixed" | "configurable";
import { DiscountType } from "./product.model";

export interface BundleItemRule {
  variant: string;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
}

export interface Bundle {
  _id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  bundleType: BundleType;
  seller?: string | null;
  items: BundleItemRule[];
  bundlePrice?: number;
  discountType: DiscountType;
  discountValue: number;
  minItems?: number;
  maxItems?: number;
  isActive: boolean;
  imageUrl?: string;
}

export interface BundleSelection {
  variant: string;
  quantity: number;
}

export interface BundleValidateResponse {
  valid: boolean;
  reasons?: string[];
}

export interface BundleQuoteResponse {
  subtotal: number;
  discountTotal: number;
  total: number;
  items: Array<{ variant: string; unitPrice: number; quantity: number; lineTotal: number }>;
}
