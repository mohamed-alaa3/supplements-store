import { Injectable, computed, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { AddWishlistItemPayload, ApiSuccess, Wishlist } from "../models";

@Injectable({ providedIn: "root" })
export class WishlistService {
  private readonly base = `${environment.apiUrl}/wishlist`;

  private readonly _wishlist = signal<Wishlist | null>(null);
  readonly wishlist = this._wishlist.asReadonly();
  readonly itemCount = computed(() => this._wishlist()?.items.length ?? 0);

  constructor(private http: HttpClient) {}

  refresh(): Observable<ApiSuccess<Wishlist>> {
    return this.http.get<ApiSuccess<Wishlist>>(this.base).pipe(tap((res) => this._wishlist.set(res.data)));
  }

  addItem(payload: AddWishlistItemPayload): Observable<ApiSuccess<Wishlist>> {
    return this.http.post<ApiSuccess<Wishlist>>(`${this.base}/items`, payload)
      .pipe(tap((res) => this._wishlist.set(res.data)));
  }

  removeItem(itemId: string): Observable<ApiSuccess<Wishlist>> {
    return this.http.delete<ApiSuccess<Wishlist>>(`${this.base}/items/${itemId}`)
      .pipe(tap((res) => this._wishlist.set(res.data)));
  }

  clear(): Observable<ApiSuccess<Wishlist>> {
    return this.http.delete<ApiSuccess<Wishlist>>(this.base).pipe(tap((res) => this._wishlist.set(res.data)));
  }

  resetLocal(): void {
    this._wishlist.set(null);
  }
}
