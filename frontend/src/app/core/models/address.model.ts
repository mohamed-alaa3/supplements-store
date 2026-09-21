export interface Address {
  _id: string;
  user: string;
  label: string;
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
  isDefault: boolean;
}

export type AddressPayload = Omit<Address, "_id" | "user">;
