import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { Address, AddressPayload, ApiSuccess, User, UserRole } from "../models";

@Injectable({ providedIn: "root" })
export class UserService {
  private readonly base = `${environment.apiUrl}/users`;
  private readonly adminBase = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  getMe(): Observable<ApiSuccess<User>> {
    return this.http.get<ApiSuccess<User>>(`${this.base}/me`);
  }

  listAddresses(): Observable<ApiSuccess<Address[]>> {
    return this.http.get<ApiSuccess<Address[]>>(`${this.base}/me/addresses`);
  }

  createAddress(payload: AddressPayload): Observable<ApiSuccess<Address>> {
    return this.http.post<ApiSuccess<Address>>(`${this.base}/me/addresses`, payload);
  }

  updateAddress(id: string, payload: Partial<AddressPayload>): Observable<ApiSuccess<Address>> {
    return this.http.patch<ApiSuccess<Address>>(`${this.base}/me/addresses/${id}`, payload);
  }

  deleteAddress(id: string): Observable<ApiSuccess<null>> {
    return this.http.delete<ApiSuccess<null>>(`${this.base}/me/addresses/${id}`);
  }

  setDefaultAddress(id: string): Observable<ApiSuccess<Address>> {
    return this.http.patch<ApiSuccess<Address>>(`${this.base}/me/addresses/${id}/default`, {});
  }

  // ---- Admin -------------------------------------------------------------
  adminListUsers(params: { role?: UserRole; search?: string; page?: number; limit?: number } = {}):
    Observable<ApiSuccess<User[]>> {
    return this.http.get<ApiSuccess<User[]>>(this.adminBase, { params: params as any });
  }

  adminSetUserStatus(id: string, isActive: boolean): Observable<ApiSuccess<User>> {
    return this.http.patch<ApiSuccess<User>>(`${this.adminBase}/${id}/status`, { isActive });
  }

  adminSetUserRole(id: string, role: UserRole): Observable<ApiSuccess<User>> {
    return this.http.patch<ApiSuccess<User>>(`${this.adminBase}/${id}/role`, { role });
  }
}
