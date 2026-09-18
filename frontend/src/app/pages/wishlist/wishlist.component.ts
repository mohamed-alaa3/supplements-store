import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RevealDirective } from '../../core/motion/reveal.directive';
import { StockBadgeComponent } from '../../shared/components/stock-badge/stock-badge.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MediaUrlPipe } from '../../core/pipes/media-url.pipe';

type AsyncState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, RevealDirective, StockBadgeComponent, LoadingSkeletonComponent, EmptyStateComponent, MediaUrlPipe],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss'
})
export class WishlistComponent implements OnInit {
  state = signal<AsyncState>('loading');

  constructor(
    public wishlist: WishlistService,
    private cart: CartService,
    public lang: LanguageService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.wishlist.refresh().subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('error')
    });
  }

  remove(itemId: string): void {
    this.wishlist.removeItem(itemId).subscribe(() =>
      this.toast.success(this.lang.pick('تمت الإزالة من المفضلة', 'Removed from wishlist')));
  }

  moveToCart(productId: string, variantId: string | null | undefined, itemId: string): void {
    if (!variantId) {
      this.toast.error(this.lang.pick('يرجى اختيار الخيار من صفحة المنتج', 'Please choose an option from the product page'));
      return;
    }
    this.cart.addItem({ variant: variantId, quantity: 1 }).subscribe(() => {
      this.wishlist.removeItem(itemId).subscribe();
      this.toast.success(this.lang.pick('تمت الإضافة إلى السلة', 'Added to cart'));
    });
  }
}
