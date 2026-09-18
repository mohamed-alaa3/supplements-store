export type SellerStatus = "pending" | "active" | "suspended";

export interface SellerProfile {
  _id: string;
  user: string;
  storeName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  contactPhone?: string;
  status: SellerStatus;
  verificationNotes?: string;
  createdAt: string;
}

export interface SellerApplicationPayload {
  storeName: string;
  description?: string;
  contactPhone?: string;
}

export interface SellerSummary {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockVariants: number;
}
