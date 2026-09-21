import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Bundle } from '../../core/models';
import { BundleService } from '../../core/services/bundle.service';
import { CartDrawerService } from '../../core/services/cart-drawer.service';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RevealDirective } from '../../core/motion/reveal.directive';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MediaUrlPipe } from '../../core/pipes/media-url.pipe';

type AsyncState = 'loading' | 'success' | 'empty' | 'error';

@Component({
  selector: 'app-bundles',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RevealDirective, LoadingSkeletonComponent, EmptyStateComponent, MediaUrlPipe],
  templateUrl: './bundles.component.html',
  styleUrl: './bundles.component.scss'
})
export class BundlesComponent implements OnInit {
  state = signal<AsyncState>('loading');
  bundles = signal<Bundle[]>([]);
  addingId = signal<string | null>(null);

  constructor(
    private bundleService: BundleService,
    private cartDrawer: CartDrawerService,
    public lang: LanguageService,
    private toast: ToastService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bundleService.list().subscribe({
      next: (res) => { this.bundles.set(res.data); this.state.set(res.data.length ? 'success' : 'empty'); },
      error: () => this.state.set('error')
    });
  }

  name(b: Bundle): string { return this.lang.pick(b.nameAr, b.nameEn); }

  quickAdd(bundle: Bundle): void {
    if (!this.auth.isAuthenticated()) {
      this.toast.error(this.lang.pick('يرجى تسجيل الدخول أولاً', 'Please log in first'));
      return;
    }
    this.addingId.set(bundle._id);
    const selections = bundle.items.map((i) => ({ variant: i.variant, quantity: i.quantity || 1 }));
    this.bundleService.addToCart(bundle._id, selections).subscribe({
      next: () => {
        this.addingId.set(null);
        this.toast.success(this.lang.pick('تمت إضافة الباقة إلى السلة', 'Bundle added to cart'));
        this.cartDrawer.open();
      },
      error: () => this.addingId.set(null)
    });
  }

  customize(bundle: Bundle): void {
    this.router.navigate(['/bundle-builder'], { queryParams: { bundleId: bundle._id } });
  }
}
