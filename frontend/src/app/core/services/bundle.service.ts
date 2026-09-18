import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, Bundle, BundleQuoteResponse, BundleSelection, BundleValidateResponse, Cart } from "../models";

@Injectable({ providedIn: "root" })
export class BundleService {
  private readonly base = `${environment.apiUrl}/bundles`;

  constructor(private http: HttpClient) {}

  list(): Observable<ApiSuccess<Bundle[]>> {
    return this.http.get<ApiSuccess<Bundle[]>>(this.base);
  }

  getById(id: string): Observable<ApiSuccess<Bundle>> {
    return this.http.get<ApiSuccess<Bundle>>(`${this.base}/${id}`);
  }

  validateSelection(bundleId: string, selections: BundleSelection[]): Observable<ApiSuccess<BundleValidateResponse>> {
    return this.http.post<ApiSuccess<BundleValidateResponse>>(`${this.base}/${bundleId}/validate`, { selections });
  }

  quote(bundleId: string, selections: BundleSelection[]): Observable<ApiSuccess<BundleQuoteResponse>> {
    return this.http.post<ApiSuccess<BundleQuoteResponse>>(`${this.base}/${bundleId}/quote`, { selections });
  }

  addToCart(bundleId: string, selections: BundleSelection[]): Observable<ApiSuccess<Cart>> {
    return this.http.post<ApiSuccess<Cart>>(`${this.base}/${bundleId}/add-to-cart`, { selections });
  }

  create(payload: Partial<Bundle>): Observable<ApiSuccess<Bundle>> {
    return this.http.post<ApiSuccess<Bundle>>(this.base, payload);
  }

  update(id: string, payload: Partial<Bundle>): Observable<ApiSuccess<Bundle>> {
    return this.http.patch<ApiSuccess<Bundle>>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.base}/${id}`);
  }
}
