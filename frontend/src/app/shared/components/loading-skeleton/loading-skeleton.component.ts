import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/** Generic shimmer placeholder. Use `variant="card"` for product grids, `variant="line"` for text. */
@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.component.html',
  styleUrl: './loading-skeleton.component.scss'
})
export class LoadingSkeletonComponent {
  @Input() variant: 'card' | 'line' | 'circle' | 'block' = 'line';
  @Input() count = 1;
  @Input() width?: string;
  @Input() height?: string;

  get items(): number[] { return Array.from({ length: this.count }); }
}
