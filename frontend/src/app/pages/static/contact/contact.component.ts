import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { RevealDirective } from '../../../core/motion/reveal.directive';

/**
 * NOTE: the backend does not document a contact-message endpoint, so this
 * form is presentational — it validates and shows a confirmation, but does
 * not persist anywhere. Wire it to a real endpoint (or an email service)
 * once one exists rather than inventing a fake one here.
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, RevealDirective],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  name = '';
  email = '';
  message = '';
  submitted = signal(false);

  constructor(public lang: LanguageService, private toast: ToastService) {}

  submit(form: NgForm): void {
    if (form.invalid) return;
    this.submitted.set(true);
    this.toast.success(this.lang.pick('تم إرسال رسالتك، سنعاود التواصل قريبًا', 'Your message was sent — we will get back to you soon'));
  }
}
