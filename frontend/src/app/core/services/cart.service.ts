import { Injectable, computed, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { AddCartItemPayload, ApiSuccess, ApplyCouponPayload, Cart, UpdateCartItemPayload } from "../models";

/**
 * The cart is server-owned (backend brief §9.7 + §11). This service is a
 * thin HTTP wrapper plus a local signal cache so the navbar badge and the
 * cart page stay in sync without re-fetching on every keystroke. Every
 * mutating call re-syncs from the server response — never computed locally.
 */
@Injectable({ providedIn: "root" })
export class CartService {
  private readonly base = `${environment.apiUrl}/cart`;

  private readonly _cart = signal<Cart | null>(null);
  readonly cart = this._cart.asReadonly();
  readonly itemCount = computed(() =>
    (this._cart()?.items ?? []).reduce((sum, item) => sum + item.quantity, 0)
  );

  constructor(private http: HttpClient) {}

  refresh(): Observable<ApiSuccess<Cart>> {
    return this.http.get<ApiSuccess<Cart>>(this.base).pipe(tap((res) => this._cart.set(res.data)));
  }

  addItem(payload: AddCartItemPayload): Observable<ApiSuccess<Cart>> {
    return this.http.post<ApiSuccess<Cart>>(`${this.base}/items`, payload)
      .pipe(tap((res) => this._cart.set(res.data)));
  }

  updateItem(itemId: string, payload: UpdateCartItemPayload): Observable<ApiSuccess<Cart>> {
    return this.http.patch<ApiSuccess<Cart>>(`${this.base}/items/${itemId}`, payload)
      .pipe(tap((res) => this._cart.set(res.data)));
  }

  removeItem(itemId: string): Observable<ApiSuccess<Cart>> {
    return this.http.delete<ApiSuccess<Cart>>(`${this.base}/items/${itemId}`)
      .pipe(tap((res) => this._cart.set(res.data)));
  }

  clear(): Observable<ApiSuccess<Cart>> {
    return this.http.delete<ApiSuccess<Cart>>(this.base).pipe(tap((res) => this._cart.set(res.data)));
  }

  applyCoupon(payload: ApplyCouponPayload): Observable<ApiSuccess<Cart>> {
    return this.http.post<ApiSuccess<Cart>>(`${this.base}/apply-coupon`, payload)
      .pipe(tap((res) => this._cart.set(res.data)));
  }

  removeCoupon(): Observable<ApiSuccess<Cart>> {
    return this.http.delete<ApiSuccess<Cart>>(`${this.base}/coupon`)
      .pipe(tap((res) => this._cart.set(res.data)));
  }

  /** Called by AuthService on logout so the badge does not leak into the next session. */
  resetLocal(): void {
    this._cart.set(null);
  }
}
