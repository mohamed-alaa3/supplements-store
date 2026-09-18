import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import { LanguageService } from '../../../core/services/language.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-price-tag',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './price-tag.component.html',
  styleUrl: './price-tag.component.scss'
})
export class PriceTagComponent {
  @Input() set price(v: number | undefined) { this._price.set(v ?? 0); }
  @Input() compareAt?: number;
  @Input() prefixFrom = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  private _price = signal(0);
  readonly hasDiscount = computed(() => !!this.compareAt && this.compareAt > this._price());

  constructor(public lang: LanguageService) {}

  format(value: number): string {
    return new Intl.NumberFormat(this.lang.lang() === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(value);
  }

  get displayPrice(): number { return this._price(); }
}
