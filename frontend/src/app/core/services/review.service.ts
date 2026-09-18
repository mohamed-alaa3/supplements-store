import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, Review, ReviewPayload, ReviewStatus } from "../models";

@Injectable({ providedIn: "root" })
export class ReviewService {
  private readonly productsBase = `${environment.apiUrl}/products`;
  private readonly reviewsBase = `${environment.apiUrl}/reviews`;
  private readonly adminBase = `${environment.apiUrl}/admin/reviews`;

  constructor(private http: HttpClient) {}

  listForProduct(productId: string): Observable<ApiSuccess<Review[]>> {
    return this.http.get<ApiSuccess<Review[]>>(`${this.productsBase}/${productId}/reviews`);
  }

  create(productId: string, payload: ReviewPayload): Observable<ApiSuccess<Review>> {
    return this.http.post<ApiSuccess<Review>>(`${this.productsBase}/${productId}/reviews`, payload);
  }

  update(reviewId: string, payload: Partial<ReviewPayload>): Observable<ApiSuccess<Review>> {
    return this.http.patch<ApiSuccess<Review>>(`${this.reviewsBase}/${reviewId}`, payload);
  }

  remove(reviewId: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.reviewsBase}/${reviewId}`);
  }

  // ---- Admin moderation -----------------------------------------------------
  adminQueue(): Observable<ApiSuccess<Review[]>> {
    return this.http.get<ApiSuccess<Review[]>>(this.adminBase);
  }

  adminSetStatus(reviewId: string, status: ReviewStatus): Observable<ApiSuccess<Review>> {
    return this.http.patch<ApiSuccess<Review>>(`${this.adminBase}/${reviewId}/status`, { status });
  }
}
