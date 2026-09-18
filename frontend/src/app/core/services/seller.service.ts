import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, Order, SellerApplicationPayload, SellerProfile, SellerStatus, SellerSummary } from "../models";

@Injectable({ providedIn: "root" })
export class SellerService {
  private readonly base = `${environment.apiUrl}/sellers`;
  private readonly sellerScoped = `${environment.apiUrl}/seller`;
  private readonly adminBase = `${environment.apiUrl}/admin/sellers`;

  constructor(private http: HttpClient) {}

  apply(payload: SellerApplicationPayload): Observable<ApiSuccess<SellerProfile>> {
    return this.http.post<ApiSuccess<SellerProfile>>(`${this.base}/apply`, payload);
  }

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
    return this.http.patch<ApiSuccess<SellerProfile>>(`${this.adminBase}/${id}/status`, { status });
  }
}
