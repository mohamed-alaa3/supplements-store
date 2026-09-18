export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  _id: string;
  user: string;
  userName?: string;
  product: string;
  order?: string;
  rating: number;
  title?: string;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface ReviewPayload {
  rating: number;
  title?: string;
  comment: string;
  order?: string;
}
