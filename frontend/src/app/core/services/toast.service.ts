import { Injectable, signal } from "@angular/core";

export type ToastKind = "success" | "error" | "info";
export interface Toast { id: number; kind: ToastKind; message: string; }

/** Minimal global toast queue rendered by <app-toast-host> in AppComponent. */
@Injectable({ providedIn: "root" })
export class ToastService {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, kind: ToastKind = "info", durationMs = 3500): void {
    const toast: Toast = { id: this.nextId++, kind, message };
    this._toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  success(message: string): void { this.show(message, "success"); }
  error(message: string): void { this.show(message, "error"); }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
