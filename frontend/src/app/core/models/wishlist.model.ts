export interface WishlistItem {
  _id: string;
  product: string;
  variant?: string | null;
  productNameAr?: string;
  productNameEn?: string;
  imageUrl?: string;
  price?: number;
  stockState?: import("./product.model").StockState;
}

export interface Wishlist {
  _id: string;
  user: string;
  items: WishlistItem[];
}

export interface AddWishlistItemPayload {
  product: string;
  variant?: string;
}
