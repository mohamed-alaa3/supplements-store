import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import gsap from 'gsap';

import { Order } from '../../core/models';
import { OrderService } from '../../core/services/order.service';
import { LanguageService } from '../../core/services/language.service';
import { MotionService } from '../../core/services/motion.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type AsyncState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, LoadingSkeletonComponent, EmptyStateComponent],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss'
})
export class OrderConfirmationComponent implements OnInit, AfterViewInit {
  @ViewChild('checkmark') checkmark?: ElementRef<SVGElement>;

  state = signal<AsyncState>('loading');
  order = signal<Order | null>(null);

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    public lang: LanguageService,
    private motion: MotionService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.state.set('error'); return; }

    this.orderService.getById(id).subscribe({
      next: (res) => { this.order.set(res.data); this.state.set('success'); setTimeout(() => this.playCheckmark(), 0); },
      error: () => this.state.set('error')
    });
  }

  ngAfterViewInit(): void {}

  private playCheckmark(): void {
    const svg = this.checkmark?.nativeElement;
    if (!svg) return;
    const path = svg.querySelector('path');
    const circle = svg.querySelector('circle');
    if (!this.motion.canAnimate() || !path || !circle) return;

    const length = (path as SVGPathElement).getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.set(circle, { scale: 0, transformOrigin: '50% 50%' });
    const tl = gsap.timeline();
    tl.to(circle, { scale: 1, duration: 0.4, ease: 'back.out(2)' })
      .to(path, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, '-=0.1');
  }
}
