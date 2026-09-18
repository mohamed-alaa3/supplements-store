import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { RevealDirective } from '../../../core/motion/reveal.directive';

interface FaqEntry { qAr: string; qEn: string; aAr: string; aEn: string; }

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RevealDirective],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent {
  openIndex = signal<number | null>(0);

  entries: FaqEntry[] = [
    { qAr: 'كم يستغرق التوصيل؟', qEn: 'How long does delivery take?', aAr: 'عادة من 2 إلى 5 أيام عمل حسب المنطقة.', aEn: 'Typically 2–5 business days depending on your area.' },
    { qAr: 'هل يمكنني إلغاء طلبي؟', qEn: 'Can I cancel my order?', aAr: 'يمكنك إلغاء الطلب طالما لم يتم شحنه بعد، من صفحة طلباتي.', aEn: 'You can cancel an order from My Orders as long as it has not shipped yet.' },
    { qAr: 'هل المنتجات مختبرة معمليًا؟', qEn: 'Are products lab-tested?', aAr: 'نعمل فقط مع علامات وبائعين يقدمون منتجات مختبرة ومطابقة للمواصفات.', aEn: 'We only work with brands and sellers offering lab-tested, spec-compliant products.' },
    { qAr: 'كيف أتتبع طلبي؟', qEn: 'How do I track my order?', aAr: 'يمكنك متابعة حالة الطلب من صفحة تفاصيل الطلب في حسابك.', aEn: 'You can follow your order status from the order details page in your account.' }
  ];

  constructor(public lang: LanguageService) {}

  toggle(i: number): void {
    this.openIndex.set(this.openIndex() === i ? null : i);
  }
}
