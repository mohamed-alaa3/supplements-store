import { Injectable, signal } from '@angular/core';

/** Tiny UI-state service so the navbar's cart icon and the drawer component don't need a direct reference to each other. */
@Injectable({ providedIn: 'root' })
export class CartDrawerService {
  private readonly _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  open(): void { this._isOpen.set(true); }
  close(): void { this._isOpen.set(false); }
  toggle(): void { this._isOpen.update((v) => !v); }
}
