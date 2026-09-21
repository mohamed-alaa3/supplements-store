import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { AuthService } from "../services/auth.service";
import { UserRole } from "../models";

/**
 * Usage in routes: `canActivate: [roleGuard(["seller", "admin"])]`.
 * Frontend-only convenience; the server re-checks role on every request.
 *
 * The locally cached role can go stale: an admin can promote a customer to
 * "seller" from a *different* session while this user's tab stays open, and
 * that tab's cached `user` signal has no way to know until something
 * refetches it. Rather than polling on an interval (which would just add to
 * the "too many requests" problem), this guard does a single, one-off
 * refetch of the current user *only when the cached role fails the check*,
 * then re-checks once — so a freshly-promoted seller who clicks into
 * "Seller Dashboard" gets in immediately, without needing to log out and
 * back in, and without any request happening on every navigation.
 */
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(["/login"]);
    }

    const role = auth.role();
    if (role && allowedRoles.includes(role)) return true;

    return auth.fetchCurrentUser().pipe(
      map((res) => {
        const freshRole = res.data.role;
        return freshRole && allowedRoles.includes(freshRole) ? true : router.createUrlTree(["/"]);
      }),
      catchError(() => of(router.createUrlTree(["/"])))
    );
  };
}
