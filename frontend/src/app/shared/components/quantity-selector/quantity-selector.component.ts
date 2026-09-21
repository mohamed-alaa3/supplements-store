import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-quantity-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quantity-selector.component.html',
  styleUrl: './quantity-selector.component.scss'
})
export class QuantitySelectorComponent {
  @Input() value = 1;
  @Input() min = 1;
  @Input() max = 99;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<number>();

  decrement(): void {
    if (this.disabled || this.value <= this.min) return;
    this.valueChange.emit(this.value - 1);
  }

  increment(): void {
    if (this.disabled || this.value >= this.max) return;
    this.valueChange.emit(this.value + 1);
  }

  onInput(raw: string): void {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(this.max, Math.max(this.min, Math.round(parsed)));
    this.valueChange.emit(clamped);
  }
}
