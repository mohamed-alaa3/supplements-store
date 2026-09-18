import { CommonModule } from '@angular/common';
import { Component, HostListener, effect, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CartDrawerService } from '../../../core/services/cart-drawer.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
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
    private router: Router
  ) {
    effect(() => {
      const count = this.cart.itemCount();
      if (count > this.lastCount) {
        this.cartBump.set(true);
        clearTimeout(this.bumpTimeout);
        this.bumpTimeout = setTimeout(() => this.cartBump.set(false), 500);
      }
      this.lastCount = count;
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 8);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleAccountMenu(): void {
    this.isAccountMenuOpen.update((v) => !v);
  }

  onLogout(): void {
    this.cart.resetLocal();
    this.wishlist.resetLocal();
    this.isAccountMenuOpen.set(false);
    this.auth.logout(true);
  }

  goToSearch(query: string): void {
    if (!query.trim()) return;
    this.closeMobileMenu();
    this.router.navigate(['/search'], { queryParams: { search: query.trim() } });
  }
}
