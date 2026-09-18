import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, Brand } from "../models";

@Injectable({ providedIn: "root" })
export class BrandService {
  private readonly base = `${environment.apiUrl}/brands`;

  constructor(private http: HttpClient) {}

  list(): Observable<ApiSuccess<Brand[]>> {
    return this.http.get<ApiSuccess<Brand[]>>(this.base);
  }

  getBySlug(slug: string): Observable<ApiSuccess<Brand>> {
    return this.http.get<ApiSuccess<Brand>>(`${this.base}/${slug}`);
  }

  create(payload: Partial<Brand>): Observable<ApiSuccess<Brand>> {
    return this.http.post<ApiSuccess<Brand>>(this.base, payload);
  }

  update(id: string, payload: Partial<Brand>): Observable<ApiSuccess<Brand>> {
    return this.http.patch<ApiSuccess<Brand>>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.base}/${id}`);
  }
}
