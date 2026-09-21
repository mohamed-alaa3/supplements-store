import { Component, inject, input, output, signal, OnInit, OnDestroy, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Mail, ShieldCheck, RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '../../../core/i18n/translate.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-email-verification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './email-verification-modal.component.html',
  styleUrl: './email-verification-modal.component.scss',
})
export class EmailVerificationModalComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  protected lang = inject(LanguageService);
  private toastService = inject(ToastService);

  // Inputs/Outputs
  email = input.required<string>();
  verified = output<void>();
  closed = output<void>();

  // Icons
  readonly icons = { Mail, ShieldCheck, RefreshCw, X, CheckCircle, AlertCircle };

  // State
  code = signal('');
  isVerifying = signal(false);
  isResending = signal(false);
  isSuccess = signal(false);
  errorMessage = signal('');
  cooldownSeconds = signal(0);
  
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;
  private codeInput = viewChild<ElementRef>('codeInput');

  ngOnInit(): void {
    this.startCooldown(60);
    // Focus the code input after a small delay for the animation
    setTimeout(() => this.codeInput()?.nativeElement?.focus(), 300);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Only allow digits, max 6
    const cleaned = input.value.replace(/\D/g, '').slice(0, 6);
    this.code.set(cleaned);
    input.value = cleaned;
    this.errorMessage.set('');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.code().length === 6 && !this.isVerifying()) {
      this.verify();
    }
  }

  verify(): void {
    if (this.code().length !== 6 || this.isVerifying()) return;

    this.isVerifying.set(true);
    this.errorMessage.set('');

    this.authService.verifyEmail({ email: this.email(), code: this.code() }).subscribe({
      next: () => {
        this.isVerifying.set(false);
        this.isSuccess.set(true);
        this.toastService.success(this.translate.instant('auth.verify.success'));
        
        // Brief success state, then close
        setTimeout(() => {
          this.verified.emit();
        }, 1500);
      },
      error: (error) => {
        this.isVerifying.set(false);
        const msg = error.error?.message || this.translate.instant('common.genericError');
        this.errorMessage.set(msg);
      },
    });
  }

  resend(): void {
    if (this.cooldownSeconds() > 0 || this.isResending()) return;

    this.isResending.set(true);
    this.errorMessage.set('');

    this.authService.resendVerification({ email: this.email() }).subscribe({
      next: () => {
        this.isResending.set(false);
        this.code.set('');
        // Clear the input value too
        const inputEl = this.codeInput()?.nativeElement;
        if (inputEl) inputEl.value = '';
        this.toastService.success(this.translate.instant('auth.verify.codeSent'));
        this.startCooldown(60);
      },
      error: (error) => {
        this.isResending.set(false);
        this.toastService.error(
          error.error?.message || this.translate.instant('common.genericError')
        );
      },
    });
  }

  onBackdropClick(event: MouseEvent): void {
    // Only close if clicking the backdrop itself, not the modal content
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      // Don't close during verification or success - that would lose the flow
      if (!this.isVerifying() && !this.isSuccess()) {
        this.closed.emit();
      }
    }
  }

  private startCooldown(seconds: number): void {
    this.cooldownSeconds.set(seconds);
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      const current = this.cooldownSeconds();
      if (current <= 1) {
        this.cooldownSeconds.set(0);
        if (this.cooldownInterval) clearInterval(this.cooldownInterval);
      } else {
        this.cooldownSeconds.set(current - 1);
      }
    }, 1000);
  }
}
