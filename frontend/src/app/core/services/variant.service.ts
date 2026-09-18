import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, ProductVariant, VariantPayload } from "../models";

@Injectable({ providedIn: "root" })
export class VariantService {
  private readonly productsBase = `${environment.apiUrl}/products`;
  private readonly variantsBase = `${environment.apiUrl}/variants`;

  constructor(private http: HttpClient) {}

  listForProduct(productId: string): Observable<ApiSuccess<ProductVariant[]>> {
    return this.http.get<ApiSuccess<ProductVariant[]>>(`${this.productsBase}/${productId}/variants`);
  }

  create(productId: string, payload: VariantPayload): Observable<ApiSuccess<ProductVariant>> {
    return this.http.post<ApiSuccess<ProductVariant>>(`${this.productsBase}/${productId}/variants`, payload);
  }

  update(variantId: string, payload: Partial<VariantPayload>): Observable<ApiSuccess<ProductVariant>> {
    return this.http.patch<ApiSuccess<ProductVariant>>(`${this.variantsBase}/${variantId}`, payload);
  }

  remove(variantId: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.variantsBase}/${variantId}`);
  }
}
