import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

/**
 * UX-only gate: keeps signed-out users off account-scoped pages. The real
 * authorization boundary is the backend (401/403) — see backend brief §21.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(["/login"], { queryParams: { redirectTo: state.url } });
};
