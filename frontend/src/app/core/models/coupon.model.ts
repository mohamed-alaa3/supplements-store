export type CouponType = "percentage" | "fixed" | "free_shipping";

export interface Coupon {
  _id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startsAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  isActive: boolean;
}

export interface CouponPayload {
  code: string;
  type: CouponType;
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startsAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  perUserLimit?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  isActive?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  discountAmount?: number;
  reason?: string;
}
