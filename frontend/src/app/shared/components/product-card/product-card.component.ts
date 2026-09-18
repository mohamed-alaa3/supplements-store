import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../../../core/models';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { MediaUrlPipe } from '../../../core/pipes/media-url.pipe';
import { RatingComponent } from '../rating/rating.component';
import { PriceTagComponent } from '../price-tag/price-tag.component';
import { StockBadgeComponent } from '../stock-badge/stock-badge.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, MediaUrlPipe, RatingComponent, PriceTagComponent, StockBadgeComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductListItem;
  @Input() isWishlisted = false;
  @Output() toggleWishlist = new EventEmitter<ProductListItem>();

  constructor(public lang: LanguageService) {}

  get name(): string {
    return this.lang.pick(this.product.nameAr, this.product.nameEn);
  }

  get effectivePrice(): number {
    const p = this.product;
    if (p.discountType === 'percentage') return p.basePrice * (1 - p.discountValue / 100);
    if (p.discountType === 'fixed') return Math.max(0, p.basePrice - p.discountValue);
    return p.basePrice;
  }

  get hasDiscount(): boolean {
    return this.product.discountType !== 'none' && this.product.discountValue > 0;
  }

  onToggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleWishlist.emit(this.product);
  }
}
