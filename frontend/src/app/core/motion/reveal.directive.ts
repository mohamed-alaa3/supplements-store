import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';
import gsap from 'gsap';
import { MotionService } from '../services/motion.service';

/**
 * Scroll-reveal directive: fades/slides an element in the first time it
 * enters the viewport. Uses IntersectionObserver (cheap, no scroll-jacking)
 * and unobserves after the first reveal. Respects prefers-reduced-motion
 * via MotionService — falls back to an instant, fully-visible state.
 *
 * Usage: <div appReveal [revealDelay]="0.1">...</div>
 */
@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay = 0;
  @Input() revealY = 24;

  private el = inject(ElementRef<HTMLElement>);
  private motion = inject(MotionService);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const node = this.el.nativeElement;

    if (!this.motion.canAnimate()) {
      gsap.set(node, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(node, { opacity: 0, y: this.revealY });

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            gsap.to(node, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              delay: this.revealDelay,
              ease: 'power3.out'
            });
            this.observer?.unobserve(node);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
