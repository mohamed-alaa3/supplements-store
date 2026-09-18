import { Injectable, computed, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  ApiSuccess, AuthResponse, ChangePasswordPayload, LoginPayload,
  RegisterPayload, UpdateProfilePayload, User,
  VerifyEmailData, ResendVerificationData, VerifyEmailResponse, RegisterResponse
} from "../models";

const TOKEN_KEY = "supp_auth_token";
const USER_KEY = "supp_auth_user";

/**
 * Owns the JWT + current user in memory (signals) and mirrors them to
 * localStorage so a refresh does not log the user out. The AuthInterceptor
 * reads the token via `getToken()`. Route guards read `currentUser()`/`role()`.
 *
 * IMPORTANT: this is UX-only. The backend re-checks role/ownership on every
 * request — see backend brief §4 and §21.
 */
@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _user = signal<User | null>(this.readStoredUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly role = computed(() => this._user()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/register`, payload);
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, payload)
      .pipe(tap((res) => {
        if (res.success && res.data) {
          this.persistSession(res.data);
        }
      }));
  }

  verifyEmail(data: VerifyEmailData): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(`${this.base}/verify-email`, data);
  }

  resendVerification(data: ResendVerificationData): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(`${this.base}/resend-verification`, data);
  }

  setAuth(token: string, user: User): void {
    this.persistSession({ token, user });
  }

  fetchCurrentUser(): Observable<ApiSuccess<User>> {
    return this.http.get<ApiSuccess<User>>(`${this.base}/me`)
      .pipe(tap((res) => this.setUser(res.data)));
  }

  updateProfile(payload: UpdateProfilePayload): Observable<ApiSuccess<User>> {
    return this.http.patch<ApiSuccess<User>>(`${this.base}/me`, payload)
      .pipe(tap((res) => this.setUser(res.data)));
  }

  changePassword(payload: ChangePasswordPayload): Observable<ApiSuccess<null>> {
    return this.http.patch<ApiSuccess<null>>(`${this.base}/change-password`, payload);
  }

  forgotPassword(email: string): Observable<ApiSuccess<null>> {
    return this.http.post<ApiSuccess<null>>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiSuccess<null>> {
    return this.http.post<ApiSuccess<null>>(`${this.base}/reset-password`, { token, newPassword });
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    if (redirect) this.router.navigateByUrl("/login");
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Called by the AuthInterceptor on a 401 to clear a stale/expired session. */
  handleUnauthorized(): void {
    this.logout(true);
  }

  private persistSession(data: { token: string; user: User }): void {
    localStorage.setItem(TOKEN_KEY, data.token);
    this.setUser(data.user);
  }

  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
