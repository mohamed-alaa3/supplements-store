import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * Shared Empty / Error state block. `kind="error"` adds a retry button that
 * emits (retry); `kind="empty"` is a plain invitation-to-act message.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input() kind: 'empty' | 'error' = 'empty';
  @Input() title = '';
  @Input() body = '';
  @Input() retryLabel = 'Retry';
}
