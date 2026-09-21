import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, CancelOrderPayload, CreateOrderPayload, Order, OrderStatus } from "../models";

/**
 * §11 Order Integrity: the frontend never sends prices/totals. It sends the
 * chosen address + payment method; the server reads the cart, revalidates
 * stock/price/coupon and returns the authoritative Order.
 */
@Injectable({ providedIn: "root" })
export class OrderService {
  private readonly base = `${environment.apiUrl}/orders`;
  private readonly adminBase = `${environment.apiUrl}/admin/orders`;
  private readonly sellerBase = `${environment.apiUrl}/seller/orders`;

  constructor(private http: HttpClient) {}

  create(payload: CreateOrderPayload): Observable<ApiSuccess<Order>> {
    return this.http.post<ApiSuccess<Order>>(this.base, payload);
  }

  myOrders(): Observable<ApiSuccess<Order[]>> {
    return this.http.get<ApiSuccess<Order[]>>(`${this.base}/me`);
  }

  getById(id: string): Observable<ApiSuccess<Order>> {
    return this.http.get<ApiSuccess<Order>>(`${this.base}/${id}`);
  }

  cancel(
    id: string,
    payload: CancelOrderPayload,
  ): Observable<ApiSuccess<Order>> {
    return this.http.post<ApiSuccess<Order>>(
      `${this.base}/${id}/cancel`,
      payload,
    );
  }

  // ---- Admin ---------------------------------------------------------------
  adminList(
    params: {
      status?: OrderStatus;
      search?: string;
      sort?: "newest" | "oldest" | "total_asc" | "total_desc";
      page?: number;
      limit?: number;
    } = {},
  ): Observable<ApiSuccess<Order[]>> {
    let httpParams = new HttpParams();

    if (params.status) {
      httpParams = httpParams.set("status", params.status);
    }

    if (params.search) {
      httpParams = httpParams.set("search", params.search);
    }

    if (params.sort) {
      httpParams = httpParams.set("sort", params.sort);
    }

    if (params.page !== undefined) {
      httpParams = httpParams.set("page", params.page.toString());
    }

    if (params.limit !== undefined) {
      httpParams = httpParams.set("limit", params.limit.toString());
    }

    return this.http.get<ApiSuccess<Order[]>>(this.adminBase, {
      params: httpParams,
    });
  }

  adminUpdateStatus(
    id: string,
    status: OrderStatus,
  ): Observable<ApiSuccess<Order>> {
    return this.http.patch<ApiSuccess<Order>>(
      `${this.adminBase}/${id}/status`,
      { status },
    );
  }

  // ---- Seller ---------------------------------------------------------------
  sellerOrders(): Observable<ApiSuccess<Order[]>> {
    return this.http.get<ApiSuccess<Order[]>>(this.sellerBase);
  }

  sellerUpdateStatus(
    id: string,
    status: OrderStatus,
  ): Observable<ApiSuccess<Order>> {
    return this.http.patch<ApiSuccess<Order>>(
      `${this.sellerBase}/${id}/status`,
      { status },
    );
  }
}
