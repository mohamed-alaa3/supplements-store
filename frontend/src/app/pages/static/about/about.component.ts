import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { RevealDirective } from '../../../core/motion/reveal.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [TranslatePipe, RevealDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  constructor(public lang: LanguageService) {}
}
