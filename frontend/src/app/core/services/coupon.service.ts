import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, Coupon, CouponPayload, CouponValidationResult } from "../models";

@Injectable({ providedIn: "root" })
export class CouponService {
  private readonly validateUrl = `${environment.apiUrl}/coupons/validate`;
  private readonly adminBase = `${environment.apiUrl}/admin/coupons`;

  constructor(private http: HttpClient) {}

  validateAgainstCart(code: string): Observable<ApiSuccess<CouponValidationResult>> {
    return this.http.post<ApiSuccess<CouponValidationResult>>(this.validateUrl, { code });
  }

  adminList(): Observable<ApiSuccess<Coupon[]>> {
    return this.http.get<ApiSuccess<Coupon[]>>(this.adminBase);
  }

  adminCreate(payload: CouponPayload): Observable<ApiSuccess<Coupon>> {
    return this.http.post<ApiSuccess<Coupon>>(this.adminBase, payload);
  }

  adminUpdate(id: string, payload: Partial<CouponPayload>): Observable<ApiSuccess<Coupon>> {
    return this.http.patch<ApiSuccess<Coupon>>(`${this.adminBase}/${id}`, payload);
  }

  adminDeactivate(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.adminBase}/${id}`);
  }
}
