export interface Category {
  _id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  parent?: string | null;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
}
