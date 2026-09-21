import { CommonModule } from "@angular/common";
import { Component, HostListener, effect, signal } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";

import { AuthService } from "../../../core/services/auth.service";
import { CartService } from "../../../core/services/cart.service";
import { CartDrawerService } from "../../../core/services/cart-drawer.service";
import { WishlistService } from "../../../core/services/wishlist.service";
import { ThemeService } from "../../../core/services/theme.service";
import { LanguageService } from "../../../core/services/language.service";
import { TranslatePipe } from "../../../core/i18n/translate.pipe";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.scss",
})
export class NavbarComponent {
  readonly isScrolled = signal(false);
  readonly isMobileMenuOpen = signal(false);
  readonly isAccountMenuOpen = signal(false);
  readonly cartBump = signal(false);

  private lastCount = 0;
  private bumpTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    public auth: AuthService,
    public cart: CartService,
    public cartDrawer: CartDrawerService,
    public wishlist: WishlistService,
    public theme: ThemeService,
    public lang: LanguageService,
    private router: Router,
  ) {
    effect(
      () => {
        const count = this.cart.itemCount();

        if (count > this.lastCount) {
          this.cartBump.set(true);

          clearTimeout(this.bumpTimeout);

          this.bumpTimeout = setTimeout(() => {
            this.cartBump.set(false);
          }, 500);
        }

        this.lastCount = count;
      },
      {
        allowSignalWrites: true,
      },
    );
  }

  @HostListener("window:scroll")
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 8);
  }

  // =========================
  // Mobile Menu
  // =========================

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  // =========================
  // Mobile Navigation
  // =========================

  navigateMobile(url: string): void {
    // Close menu immediately
    this.isMobileMenuOpen.set(false);

    // Navigate using Angular Router
    this.router.navigateByUrl(url);
  }

  // =========================
  // Account
  // =========================

  toggleAccountMenu(): void {
    this.isAccountMenuOpen.update((value) => !value);
  }

  // =========================
  // Logout
  // =========================

  onLogout(): void {
    this.cart.resetLocal();
    this.wishlist.resetLocal();

    this.isAccountMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);

    this.auth.logout(true);
  }

  // =========================
  // Search
  // =========================

  goToSearch(query: string): void {
    const value = query.trim();

    if (!value) {
      return;
    }

    this.closeMobileMenu();

    this.router.navigate(["/search"], {
      queryParams: {
        search: value,
      },
    });
  }
}
