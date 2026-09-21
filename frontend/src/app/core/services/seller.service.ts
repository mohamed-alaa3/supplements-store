import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, ConvertToSellerPayload, ConvertToSellerResult, Order, SellerApplicationPayload, SellerProfile, SellerStatus, SellerSummary } from "../models";

@Injectable({ providedIn: "root" })
export class SellerService {
  private readonly base = `${environment.apiUrl}/sellers`;
  private readonly sellerScoped = `${environment.apiUrl}/seller`;
  private readonly adminSellersBase = `${environment.apiUrl}/admin/sellers`;
  private readonly adminUsersBase = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<ApiSuccess<SellerProfile>> {
    return this.http.get<ApiSuccess<SellerProfile>>(`${this.base}/me`);
  }

  updateMyProfile(payload: Partial<SellerApplicationPayload>): Observable<ApiSuccess<SellerProfile>> {
    return this.http.patch<ApiSuccess<SellerProfile>>(`${this.base}/me`, payload);
  }

  listActiveSellers(): Observable<ApiSuccess<SellerProfile[]>> {
    return this.http.get<ApiSuccess<SellerProfile[]>>(this.base);
  }

  getSellerStorefront(id: string): Observable<ApiSuccess<SellerProfile>> {
    return this.http.get<ApiSuccess<SellerProfile>>(`${this.base}/${id}`);
  }

  getMyOrders(): Observable<ApiSuccess<Order[]>> {
    return this.http.get<ApiSuccess<Order[]>>(`${this.sellerScoped}/orders`);
  }

  updateOrderStatus(orderId: string, status: string): Observable<ApiSuccess<Order>> {
    return this.http.patch<ApiSuccess<Order>>(`${this.sellerScoped}/orders/${orderId}/status`, { status });
  }

  getMySummary(): Observable<ApiSuccess<SellerSummary>> {
    return this.http.get<ApiSuccess<SellerSummary>>(`${this.sellerScoped}/summary`);
  }

  // ---- Admin -------------------------------------------------------------
  adminSetSellerStatus(id: string, status: SellerStatus): Observable<ApiSuccess<SellerProfile>> {
    return this.http.patch<ApiSuccess<SellerProfile>>(`${this.adminSellersBase}/${id}/status`, { status });
  }

  /**
   * One-step admin promotion: no application, no file/ID upload, no waiting
   * for approval. `userId` is the target *user*'s id (not a seller profile
   * id) — the backend creates/activates their SellerProfile and flips their
   * role to "seller" in a single request.
   */
  adminConvertToSeller(userId: string, payload: ConvertToSellerPayload = {}): Observable<ApiSuccess<ConvertToSellerResult>> {
    return this.http.post<ApiSuccess<ConvertToSellerResult>>(`${this.adminUsersBase}/${userId}/convert-to-seller`, payload);
  }
}
