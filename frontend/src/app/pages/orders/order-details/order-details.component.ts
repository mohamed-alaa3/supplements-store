import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Order } from '../../../core/models';
import { OrderService } from '../../../core/services/order.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type AsyncState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, LoadingSkeletonComponent, EmptyStateComponent],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss'
})
export class OrderDetailsComponent implements OnInit {
  state = signal<AsyncState>('loading');
  order = signal<Order | null>(null);
  cancelling = signal(false);
  showCancelForm = signal(false);
  cancelReason = '';

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    public lang: LanguageService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.state.set('error'); return; }
    this.load(id);
  }

  private load(id: string): void {
    this.orderService.getById(id).subscribe({
      next: (res) => { this.order.set(res.data); this.state.set('success'); },
      error: () => this.state.set('error')
    });
  }

  get canCancel(): boolean {
    const status = this.order()?.orderStatus;
    return status === 'pending' || status === 'confirmed';
  }

  cancel(): void {
    const o = this.order();
    if (!o || !this.cancelReason.trim()) return;
    this.cancelling.set(true);
    this.orderService.cancel(o._id, { cancelReason: this.cancelReason }).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.cancelling.set(false);
        this.showCancelForm.set(false);
        this.toast.success(this.lang.pick('تم إلغاء الطلب', 'Order cancelled'));
      },
      error: () => this.cancelling.set(false)
    });
  }
}
