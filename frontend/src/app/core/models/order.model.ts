export type PaymentMethod = "cash_on_delivery" | string;
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "pending" | "confirmed" | "processing" | "shipped"
  | "delivered" | "cancelled" | "returned";

export interface OrderItem {
  product: string;
  variant: string;
  nameAr: string;
  nameEn: string;
  sku: string;
  seller: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderAddressSnapshot {
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  area: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  notes?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress: OrderAddressSnapshot;
  notes?: string;
  cancelReason?: string | null;
  createdAt: string;
}

/**
 * The frontend sends ONLY the customer-selected inputs. The server reads the
 * cart from the DB and computes prices/discounts/totals itself — see backend
 * brief §11 "Order Integrity". Never add a client-side total/price here.
 */
export interface CreateOrderPayload {
  addressId?: string;
  shippingAddress?: Omit<OrderAddressSnapshot, never>;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CancelOrderPayload {
  cancelReason: string;
}
