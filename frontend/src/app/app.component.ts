import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import gsap from 'gsap';

import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastHostComponent } from './shared/components/toast-host/toast-host.component';
import { CartDrawerComponent } from './shared/components/cart-drawer/cart-drawer.component';

import { ThemeService } from './core/services/theme.service';
import { LanguageService } from './core/services/language.service';
import { MotionService } from './core/services/motion.service';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { WishlistService } from './core/services/wishlist.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, ToastHostComponent, CartDrawerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  @ViewChild('outletHost') outletHost?: ElementRef<HTMLElement>;

  // Injected here (not just inside child components) so theme/language
  // side effects (html[data-theme]/html[dir]) apply before first paint.
  private theme = inject(ThemeService);
  private lang = inject(LanguageService);
  private motion = inject(MotionService);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private wishlist = inject(WishlistService);

  constructor(private router: Router) {
    // A signed-in user's cart/wishlist should be live from the first paint,
    // not just after they open the drawer/page.
    if (this.auth.isAuthenticated()) {
      this.cart.refresh().subscribe();
      this.wishlist.refresh().subscribe();
    }

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      this.playPageTransition();
    });
  }

  private playPageTransition(): void {
    const host = this.outletHost?.nativeElement;
    if (!host || !this.motion.canAnimate()) return;
    gsap.fromTo(host, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
  }
}
