import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Order, OrderStatus } from '../../core/models';
import { OrderService } from '../../core/services/order.service';
import { LanguageService } from '../../core/services/language.service';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { RevealDirective } from '../../core/motion/reveal.directive';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type AsyncState = 'loading' | 'success' | 'empty' | 'error';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, RevealDirective, LoadingSkeletonComponent, EmptyStateComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  state = signal<AsyncState>('loading');
  orders = signal<Order[]>([]);

  constructor(private orderService: OrderService, public lang: LanguageService) {}

  ngOnInit(): void {
    this.orderService.myOrders().subscribe({
      next: (res) => { this.orders.set(res.data); this.state.set(res.data.length ? 'success' : 'empty'); },
      error: () => this.state.set('error')
    });
  }

  statusClass(status: OrderStatus): string { return 'status-badge status-badge--' + status; }
}
