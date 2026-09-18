import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { UserRole } from "../models";

/**
 * Usage in routes: `canActivate: [roleGuard(["seller", "admin"])]`.
 * Frontend-only convenience; the server re-checks role on every request.
 */
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role();

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(["/login"]);
    }
    if (role && allowedRoles.includes(role)) return true;
    return router.createUrlTree(["/"]);
  };
}
