import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

import { CartService } from "../../core/services/cart.service";
import { AuthService } from "../../core/services/auth.service";
import { LanguageService } from "../../core/services/language.service";
import { ToastService } from "../../core/services/toast.service";

import { TranslatePipe } from "../../core/i18n/translate.pipe";
import { RevealDirective } from "../../core/motion/reveal.directive";
import { QuantitySelectorComponent } from "../../shared/components/quantity-selector/quantity-selector.component";
import { StockBadgeComponent } from "../../shared/components/stock-badge/stock-badge.component";
import { LoadingSkeletonComponent } from "../../shared/components/loading-skeleton/loading-skeleton.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { MediaUrlPipe } from "../../core/pipes/media-url.pipe";

type AsyncState = "loading" | "success" | "error";

@Component({
  selector: "app-cart",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    RevealDirective,
    QuantitySelectorComponent,
    StockBadgeComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    MediaUrlPipe,
  ],
  templateUrl: "./cart.component.html",
  styleUrl: "./cart.component.scss",
})
export class CartComponent implements OnInit {
  state = signal<AsyncState>("loading");
  couponCode = "";
  applyingCoupon = signal(false);

  constructor(
    public cart: CartService,
    public auth: AuthService,
    public lang: LanguageService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  private loadCart(): void {
    if (!this.auth.isAuthenticated()) {
      this.state.set("success");
      return;
    }

    this.state.set("loading");

    this.cart.refresh().subscribe({
      next: () => this.state.set("success"),
      error: () => this.state.set("error"),
    });
  }

  onQuantityChange(itemId: string, quantity: number): void {
    const safeQuantity = Math.max(1, Math.min(20, Math.floor(quantity)));

    if (!Number.isFinite(safeQuantity)) {
      return;
    }

    this.cart.updateItem(itemId, { quantity: safeQuantity }).subscribe({
      error: () => {
        this.toast.error(
          this.lang.pick(
            "حدث خطأ أثناء تحديث الكمية",
            "Could not update quantity",
          ),
        );
      },
    });
  }

  onRemove(itemId: string): void {
    this.cart.removeItem(itemId).subscribe({
      next: () => {
        this.toast.success(this.lang.pick("تمت الإزالة", "Item removed"));
      },
      error: () => {
        this.toast.error(
          this.lang.pick("حدث خطأ أثناء الإزالة", "Could not remove item"),
        );
      },
    });
  }

  applyCoupon(): void {
    const code = this.couponCode.trim();

    if (!code || this.applyingCoupon()) {
      return;
    }

    this.applyingCoupon.set(true);

    this.cart.applyCoupon({ code }).subscribe({
      next: () => {
        this.applyingCoupon.set(false);
        this.couponCode = "";

        this.toast.success(
          this.lang.pick("تم تطبيق الكوبون", "Coupon applied"),
        );
      },
      error: () => {
        this.applyingCoupon.set(false);
      },
    });
  }

  removeCoupon(): void {
    this.cart.removeCoupon().subscribe({
      next: () => {
        this.toast.success(
          this.lang.pick("تمت إزالة الكوبون", "Coupon removed"),
        );
      },
    });
  }

  retry(): void {
    this.loadCart();
  }
}
