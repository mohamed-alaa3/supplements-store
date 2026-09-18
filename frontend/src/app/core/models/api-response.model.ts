/**
 * Every real backend response follows one of these two shapes
 * (see backend brief section 7 — REST & Response Standards).
 * Services unwrap `.data`; components never touch the envelope directly.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
