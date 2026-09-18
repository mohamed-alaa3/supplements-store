import { HttpClient } from "@angular/common/http";
import { Injectable, effect, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { LanguageService } from "../services/language.service";

type Dict = Record<string, any>;

/**
 * Small hand-rolled i18n service (no external i18n library dependency).
 * Loads /assets/i18n/{lang}.json, exposes `instant(key)` for templates via
 * TranslatePipe, and reloads whenever LanguageService changes.
 */
@Injectable({ providedIn: "root" })
export class TranslateService {
  private readonly dict = signal<Dict>({});

  constructor(private http: HttpClient, private lang: LanguageService) {
    effect(() => {
      this.load(this.lang.lang());
    });
  }

  async load(lang: string): Promise<void> {
    const data = await firstValueFrom(this.http.get<Dict>(`/assets/i18n/${lang}.json`));
    this.dict.set(data);
  }

  instant(key: string, params?: Record<string, string | number>): string {
    const value = key.split(".").reduce<any>((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), this.dict());
    let result = typeof value === "string" ? value : key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(`{${k}}`, String(v));
      }
    }
    return result;
  }

  get signalRef() { return this.dict; }
}
