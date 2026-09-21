export interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  country?: string;
  isActive: boolean;
}
