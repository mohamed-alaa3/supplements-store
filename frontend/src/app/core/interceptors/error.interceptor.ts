import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";
import { ToastService } from "../services/toast.service";

/**
 * Maps backend error envelopes ({ success:false, message, errors? }) into a
 * single readable toast for anything not already handled by AuthInterceptor
 * (400/404/409/500). Components can still catch the raw error for
 * field-level display; this only guarantees the user is never left silent.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 && error.status !== 403) {
        const message = error.error?.message
          ?? (error.status === 0
            ? "Cannot reach the server. Check your connection."
            : "Something went wrong. Please try again.");
        toast.error(message);
      }
      return throwError(() => error);
    })
  );
};
