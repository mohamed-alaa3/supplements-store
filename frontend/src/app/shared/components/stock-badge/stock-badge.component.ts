import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { StockState } from '../../../core/models';

@Component({
  selector: 'app-stock-badge',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './stock-badge.component.html',
  styleUrl: './stock-badge.component.scss'
})
export class StockBadgeComponent {
  @Input() state: StockState = 'in_stock';

  get labelKey(): string {
    return this.state === 'out_of_stock' ? 'common.outOfStock'
      : this.state === 'low_stock' ? 'common.lowStock'
      : 'common.inStock';
  }
}
