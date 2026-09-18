import { Pipe, PipeTransform, inject } from "@angular/core";
import { TranslateService } from "./translate.service";

@Pipe({ name: "t", standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.translate.instant(key, params);
  }
}
