import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";
import { ToastService } from "../services/toast.service";
import { LanguageService } from "../services/language.service";

/**
 * Attaches `Authorization: Bearer <token>` to every request when a session
 * exists, and reacts to 401/403 per backend brief §"HTTP Interceptor".
 * Never logs the token.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const lang = inject(LanguageService);
  const token = auth.getToken();

  const authorizedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only treat a 401 as an *expired session* when we actually sent a
      // token on this request. A 401 on an unauthenticated request (e.g. a
      // login attempt with the wrong password) means "invalid credentials",
      // not "your session expired" — let the calling component show its own
      // error message instead of forcing a logout + misleading toast here.
      if (error.status === 401 && token) {
        auth.handleUnauthorized();
        toast.error(lang.pick("انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.", "Your session expired. Please sign in again."));
      } else if (error.status === 403 && token) {
        // Same reasoning: a 403 on an unauthenticated request (e.g. "please
        // verify your email before logging in") is a business-rule reply the
        // calling component already surfaces inline — not a permissions
        // error, so don't show the generic "no permission" toast for it.
        toast.error(lang.pick("ليس لديك صلاحية للقيام بذلك.", "You do not have permission to do that."));
      }
      return throwError(() => error);
    })
  );
};
