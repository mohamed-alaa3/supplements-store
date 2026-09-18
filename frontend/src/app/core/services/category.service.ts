import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, Category } from "../models";

@Injectable({ providedIn: "root" })
export class CategoryService {
  private readonly base = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  list(): Observable<ApiSuccess<Category[]>> {
    return this.http.get<ApiSuccess<Category[]>>(this.base);
  }

  getBySlug(slug: string): Observable<ApiSuccess<Category>> {
    return this.http.get<ApiSuccess<Category>>(`${this.base}/${slug}`);
  }

  create(payload: Partial<Category>): Observable<ApiSuccess<Category>> {
    return this.http.post<ApiSuccess<Category>>(this.base, payload);
  }

  update(id: string, payload: Partial<Category>): Observable<ApiSuccess<Category>> {
    return this.http.patch<ApiSuccess<Category>>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.base}/${id}`);
  }
}
