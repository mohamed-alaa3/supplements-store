import { Injectable, computed, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, finalize, shareReplay, tap } from "rxjs";
import { environment } from "../../../environments/environment";

import {
  ApiSuccess,
  AuthResponse,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
  VerifyEmailData,
  ResendVerificationData,
  VerifyEmailResponse,
  RegisterResponse,
} from "../models";

const TOKEN_KEY = "supp_auth_token";
const USER_KEY = "supp_auth_user";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _user = signal<User | null>(this.readStoredUser());

  private currentUserInFlight?: Observable<ApiSuccess<User>>;

  readonly user = this._user.asReadonly();

  readonly isAuthenticated = computed(() => !!this._user());

  readonly role = computed(() => this._user()?.role ?? null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // =====================================================
  // AUTH
  // =====================================================

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/register`, payload);
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, payload).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.persistSession(res.data);
        }
      }),
    );
  }

  verifyEmail(data: VerifyEmailData): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(
      `${this.base}/verify-email`,
      data,
    );
  }

  resendVerification(data: ResendVerificationData): Observable<{
    success: boolean;
    message?: string;
  }> {
    return this.http.post<{
      success: boolean;
      message?: string;
    }>(`${this.base}/resend-verification`, data);
  }

  // =====================================================
  // PASSWORD RESET
  // =====================================================

  /**
   * Sends a 6-digit OTP to the user's email.
   */
  forgotPassword(email: string): Observable<ApiSuccess<null>> {
    return this.http.post<ApiSuccess<null>>(`${this.base}/forgot-password`, {
      email,
    });
  }

  /**
   * Verifies the 6-digit OTP.
   *
   * Backend returns a temporary resetToken.
   */
  verifyResetOtp(
    email: string,
    code: string,
  ): Observable<
    ApiSuccess<{
      resetToken: string;
    }>
  > {
    return this.http.post<
      ApiSuccess<{
        resetToken: string;
      }>
    >(`${this.base}/verify-reset-otp`, {
      email,
      code,
    });
  }

  /**
   * Sends another OTP.
   */
  resendResetOtp(email: string): Observable<ApiSuccess<null>> {
    return this.http.post<ApiSuccess<null>>(`${this.base}/resend-reset-otp`, {
      email,
    });
  }

  /**
   * Changes the password using the temporary
   * resetToken returned after successful OTP verification.
   */
  resetPassword(
    resetToken: string,
    newPassword: string,
  ): Observable<ApiSuccess<null>> {
    return this.http.post<ApiSuccess<null>>(`${this.base}/reset-password`, {
      resetToken,
      newPassword,
    });
  }

  // =====================================================
  // USER
  // =====================================================

  setAuth(token: string, user: User): void {
    this.persistSession({ token, user });
  }

  fetchCurrentUser(): Observable<ApiSuccess<User>> {
    if (this.currentUserInFlight) {
      return this.currentUserInFlight;
    }

    this.currentUserInFlight = this.http
      .get<ApiSuccess<User>>(`${this.base}/me`)
      .pipe(
        tap((res) => this.setUser(res.data)),

        finalize(() => {
          this.currentUserInFlight = undefined;
        }),

        shareReplay({
          bufferSize: 1,
          refCount: true,
        }),
      );

    return this.currentUserInFlight;
  }

  updateProfile(payload: UpdateProfilePayload): Observable<ApiSuccess<User>> {
    return this.http
      .patch<ApiSuccess<User>>(`${this.base}/me`, payload)
      .pipe(tap((res) => this.setUser(res.data)));
  }

  changePassword(payload: ChangePasswordPayload): Observable<ApiSuccess<null>> {
    return this.http.patch<ApiSuccess<null>>(
      `${this.base}/change-password`,
      payload,
    );
  }

  // =====================================================
  // SESSION
  // =====================================================

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    this._user.set(null);

    if (redirect) {
      this.router.navigateByUrl("/login");
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  handleUnauthorized(): void {
    this.logout(true);
  }

  // =====================================================
  // PRIVATE
  // =====================================================

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
