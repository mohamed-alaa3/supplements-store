import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, Inventory, InventoryAdjustmentPayload } from "../models";

@Injectable({ providedIn: "root" })
export class InventoryService {
  private readonly base = `${environment.apiUrl}/inventory`;
  private readonly sellerBase = `${environment.apiUrl}/seller/inventory`;
  private readonly adminBase = `${environment.apiUrl}/admin/inventory`;

  constructor(private http: HttpClient) {}

  getForVariant(variantId: string): Observable<ApiSuccess<Inventory>> {
    return this.http.get<ApiSuccess<Inventory>>(`${this.base}/variant/${variantId}`);
  }

  updateForVariant(variantId: string, payload: Partial<Inventory>): Observable<ApiSuccess<Inventory>> {
    return this.http.patch<ApiSuccess<Inventory>>(`${this.base}/variant/${variantId}`, payload);
  }

  getMyInventory(): Observable<ApiSuccess<Inventory[]>> {
    return this.http.get<ApiSuccess<Inventory[]>>(this.sellerBase);
  }

  adminOverview(): Observable<ApiSuccess<Inventory[]>> {
    return this.http.get<ApiSuccess<Inventory[]>>(this.adminBase);
  }

  adminAdjust(payload: InventoryAdjustmentPayload): Observable<ApiSuccess<Inventory>> {
    return this.http.post<ApiSuccess<Inventory>>(`${this.adminBase}/adjustments`, payload);
  }
}
