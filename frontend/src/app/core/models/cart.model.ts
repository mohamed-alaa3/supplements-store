export interface CartItem {
  _id: string;
  variant: string;
  // Denormalized display data the backend joins in for convenience.
  // Treat as read-only — price/availability are re-validated server-side at checkout.
  productId?: string;
  productNameAr?: string;
  productNameEn?: string;
  variantLabel?: string;
  imageUrl?: string;
  unitPrice?: number;
  quantity: number;
  lineTotal?: number;
  stockState?: import("./product.model").StockState;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  coupon?: string | null;
  couponCode?: string | null;
  subtotal?: number;
  discountTotal?: number;
  total?: number;
}

export interface AddCartItemPayload {
  variant: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export interface ApplyCouponPayload {
  code: string;
}
