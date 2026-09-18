import {
  AfterViewInit,
  Component,
  EffectRef,
  ElementRef,
  Injector,
  OnDestroy,
  ViewChild,
  effect,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { A11yModule } from "@angular/cdk/a11y";
import gsap from "gsap";

import { CartDrawerService } from "../../../core/services/cart-drawer.service";
import { CartService } from "../../../core/services/cart.service";
import { LanguageService } from "../../../core/services/language.service";
import { MotionService } from "../../../core/services/motion.service";
import { ToastService } from "../../../core/services/toast.service";

import { TranslatePipe } from "../../../core/i18n/translate.pipe";
import { MediaUrlPipe } from "../../../core/pipes/media-url.pipe";
import { QuantitySelectorComponent } from "../quantity-selector/quantity-selector.component";
import { StockBadgeComponent } from "../stock-badge/stock-badge.component";

@Component({
  selector: "app-cart-drawer",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    A11yModule,
    TranslatePipe,
    MediaUrlPipe,
    QuantitySelectorComponent,
    StockBadgeComponent,
  ],
  templateUrl: "./cart-drawer.component.html",
  styleUrl: "./cart-drawer.component.scss",
})
export class CartDrawerComponent implements AfterViewInit, OnDestroy {
  @ViewChild("panel")
  panelRef?: ElementRef<HTMLElement>;

  @ViewChild("backdrop")
  backdropRef?: ElementRef<HTMLElement>;

  drawer = inject(CartDrawerService);
  cart = inject(CartService);
  lang = inject(LanguageService);

  private motion = inject(MotionService);
  private toast = inject(ToastService);
  private injector = inject(Injector);

  private drawerEffect?: EffectRef;

  /**
   * Prevents the first render from playing an animation.
   * This also prevents the drawer from flashing during refresh.
   */
  private initialized = false;

  ngAfterViewInit(): void {
    this.drawerEffect = effect(
      () => {
        const open = this.drawer.isOpen();

        const panel = this.panelRef?.nativeElement;
        const backdrop = this.backdropRef?.nativeElement;

        if (!panel || !backdrop) {
          return;
        }

        this.animateDrawer(open, panel, backdrop);
      },
      {
        injector: this.injector,
      },
    );
  }

  private animateDrawer(
    open: boolean,
    panel: HTMLElement,
    backdrop: HTMLElement,
  ): void {
    const fromX = this.lang.isRtl() ? "-100%" : "100%";

    // Stop previous animations.
    gsap.killTweensOf([panel, backdrop]);

    /**
     * First render:
     * Set the correct state immediately without animation.
     *
     * This is the important part that prevents
     * the drawer from appearing for a moment after refresh.
     */
    if (!this.initialized) {
      gsap.set(panel, {
        x: open ? "0%" : fromX,
        visibility: open ? "visible" : "hidden",
      });

      gsap.set(backdrop, {
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
      });

      this.initialized = true;

      return;
    }

    /**
     * Reduced motion / animations disabled.
     */
    if (!this.motion.canAnimate()) {
      gsap.set(panel, {
        x: open ? "0%" : fromX,
        visibility: open ? "visible" : "hidden",
      });

      gsap.set(backdrop, {
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
      });

      return;
    }

    /**
     * OPEN
     */
    if (open) {
      gsap.set(panel, {
        x: fromX,
        visibility: "visible",
      });

      gsap.set(backdrop, {
        opacity: 0,
        pointerEvents: "auto",
      });

      // Backdrop animation.
      gsap.to(backdrop, {
        opacity: 1,
        duration: 0.25,
        ease: "power2.out",
      });

      // Drawer animation.
      gsap.to(panel, {
        x: "0%",
        duration: 0.4,
        ease: "power3.out",
      });

      return;
    }

    /**
     * CLOSE
     */
    gsap.to(backdrop, {
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",

      onComplete: () => {
        gsap.set(backdrop, {
          pointerEvents: "none",
        });
      },
    });

    gsap.to(panel, {
      x: fromX,
      duration: 0.35,
      ease: "power2.in",

      onComplete: () => {
        gsap.set(panel, {
          visibility: "hidden",
        });
      },
    });
  }

  onQuantityChange(itemId: string, quantity: number): void {
    // Ignore invalid quantities.
    if (!Number.isFinite(quantity) || quantity < 1) {
      return;
    }

    this.cart.updateItem(itemId, { quantity }).subscribe({
      error: () => {
        this.toast.error(
          this.lang.pick(
            "حدث خطأ أثناء تحديث الكمية",
            "Failed to update quantity",
          ),
        );
      },
    });
  }

  onRemove(itemId: string): void {
    this.cart.removeItem(itemId).subscribe({
      next: () => {
        this.toast.success(this.lang.pick("تمت إزالة المنتج", "Item removed"));
      },

      error: () => {
        this.toast.error(
          this.lang.pick("حدث خطأ أثناء إزالة المنتج", "Failed to remove item"),
        );
      },
    });
  }

  close(): void {
    this.drawer.close();
  }

  ngOnDestroy(): void {
    this.drawerEffect?.destroy();

    const panel = this.panelRef?.nativeElement;
    const backdrop = this.backdropRef?.nativeElement;

    if (panel) {
      gsap.killTweensOf(panel);
    }

    if (backdrop) {
      gsap.killTweensOf(backdrop);
    }
  }
}
