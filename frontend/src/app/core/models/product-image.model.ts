export interface ProductImage {
  _id: string;
  product: string;
  variant?: string | null;
  url: string;
  altAr?: string;
  altEn?: string;
  sortOrder: number;
  isPrimary: boolean;
}
