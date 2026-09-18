import { Injectable, effect, signal } from "@angular/core";
import { AppLanguage } from "../models";

const STORAGE_KEY = "supp_lang";

/**
 * Drives html[lang]/html[dir] and exposes a `pick()` helper so components can
 * read the correct bilingual field (nameAr/nameEn, etc.) without branching
 * everywhere. Pair with TranslateService for static UI strings.
 */
@Injectable({ providedIn: "root" })
export class LanguageService {
  private readonly _lang = signal<AppLanguage>(this.resolveInitialLang());
  readonly lang = this._lang.asReadonly();
  readonly isRtl = () => this._lang() === "ar";

  constructor() {
    effect(() => {
      const lang = this._lang();
      document.documentElement.setAttribute("lang", lang);
      document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
      localStorage.setItem(STORAGE_KEY, lang);
    });
  }

  setLang(lang: AppLanguage): void {
    this._lang.set(lang);
  }

  toggle(): void {
    this._lang.set(this._lang() === "ar" ? "en" : "ar");
  }

  /** Picks the right side of a bilingual pair, e.g. pick(p.nameAr, p.nameEn). */
  pick(ar: string | undefined | null, en: string | undefined | null): string {
    const value = this._lang() === "ar" ? ar : en;
    return value ?? en ?? ar ?? "";
  }

  private resolveInitialLang(): AppLanguage {
    const stored = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
    if (stored === "ar" || stored === "en") return stored;
    return navigator.language?.toLowerCase().startsWith("ar") ? "ar" : "en";
  }
}
