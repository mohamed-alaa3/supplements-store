import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ApiSuccess, Banner, BannerPayload } from "../models";

@Injectable({ providedIn: "root" })
export class BannerService {
  private readonly base = `${environment.apiUrl}/banners`;

  constructor(private http: HttpClient) {}

  list(): Observable<ApiSuccess<Banner[]>> {
    return this.http.get<ApiSuccess<Banner[]>>(this.base);
  }

  create(payload: BannerPayload): Observable<ApiSuccess<Banner>> {
    return this.http.post<ApiSuccess<Banner>>(this.base, payload);
  }

  update(id: string, payload: Partial<BannerPayload>): Observable<ApiSuccess<Banner>> {
    return this.http.patch<ApiSuccess<Banner>>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.base}/${id}`);
  }
}
