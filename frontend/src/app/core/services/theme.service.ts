import { Injectable, effect, signal } from "@angular/core";

export type ThemeMode = "light" | "dark";
const STORAGE_KEY = "supp_theme";

/**
 * Owns the light/dark theme only. (Static UI translations live in
 * TranslateService + assets/i18n/*.json — see TranslatePipe.)
 */
@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly _theme = signal<ThemeMode>(this.resolveInitialTheme());
  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      const mode = this._theme();
      document.documentElement.setAttribute("data-theme", mode);
      localStorage.setItem(STORAGE_KEY, mode);
    });
  }

  toggle(): void {
    this._theme.set(this._theme() === "light" ? "dark" : "light");
  }

  setTheme(mode: ThemeMode): void {
    this._theme.set(mode);
  }

  private resolveInitialTheme(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
}
