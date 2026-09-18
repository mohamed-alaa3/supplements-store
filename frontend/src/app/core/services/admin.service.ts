import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess } from "../models";

export interface AdminOverview {
  productsCount: number;
  usersCount: number;
  sellersCount: number;
  ordersCount: number;
  pendingReviewsCount: number;
  lowStockVariantsCount: number;
}

/** Thin wrapper for the admin overview endpoint; CRUD for each resource lives in its own service (ProductService, OrderService, etc.) to avoid one god-service. */
@Injectable({ providedIn: "root" })
export class AdminService {
  private readonly base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<ApiSuccess<AdminOverview>> {
    return this.http.get<ApiSuccess<AdminOverview>>(`${this.base}/overview`);
  }
}
