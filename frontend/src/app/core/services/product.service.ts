import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, PaginationMeta, ProductImage, ProductListItem, ProductPayload, ProductQueryParams } from "../models";

/**
 * Matches GET /api/products query params exactly (backend brief §9.5):
 * search, category, brand, seller, productType, minPrice, maxPrice,
 * minRating, inStock, featured, bestSeller, sort, page, limit.
 * Do not add parameter names the backend does not define.
 */
@Injectable({ providedIn: "root" })
export class ProductService {
  private readonly base = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  list(query: ProductQueryParams): Observable<ApiSuccess<ProductListItem[]> & { meta?: PaginationMeta }> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<ApiSuccess<ProductListItem[]>>(this.base, { params });
  }

  getById(id: string): Observable<ApiSuccess<ProductListItem>> {
    return this.http.get<ApiSuccess<ProductListItem>>(`${this.base}/${id}`);
  }

  getBySlug(slug: string): Observable<ApiSuccess<ProductListItem>> {
    return this.http.get<ApiSuccess<ProductListItem>>(`${this.base}/slug/${slug}`);
  }

  getImages(productId: string): Observable<ApiSuccess<ProductImage[]>> {
    return this.http.get<ApiSuccess<ProductImage[]>>(`${this.base}/${productId}/images`);
  }

  // ---- Seller/Admin --------------------------------------------------------
  create(payload: ProductPayload): Observable<ApiSuccess<ProductListItem>> {
    return this.http.post<ApiSuccess<ProductListItem>>(this.base, payload);
  }

  update(id: string, payload: Partial<ProductPayload>): Observable<ApiSuccess<ProductListItem>> {
    return this.http.patch<ApiSuccess<ProductListItem>>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.base}/${id}`);
  }

  setStatus(id: string, isActive: boolean): Observable<ApiSuccess<ProductListItem>> {
    return this.http.patch<ApiSuccess<ProductListItem>>(`${this.base}/${id}/status`, { isActive });
  }

  addImage(productId: string, payload: { url: string; altAr?: string; altEn?: string; isPrimary?: boolean; variant?: string }):
    Observable<ApiSuccess<ProductImage>> {
    return this.http.post<ApiSuccess<ProductImage>>(`${this.base}/${productId}/images`, payload);
  }

  deleteImage(productId: string, imageId: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.base}/${productId}/images/${imageId}`);
  }
}
