import { CommonModule } from "@angular/common";
import { Component, Input, computed, signal } from "@angular/core";

@Component({
  selector: "app-rating",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./rating.component.html",
  styleUrl: "./rating.component.scss"
})
export class RatingComponent {
  @Input() set value(v: number | undefined) { this._value.set(v ?? 0); }
  @Input() count?: number;
  @Input() size: "sm" | "md" = "sm";

  private _value = signal(0);
  readonly stars = computed(() => Array.from({ length: 5 }, (_, i) => i < Math.round(this._value())));
  readonly displayValue = computed(() => this._value().toFixed(1));
}
