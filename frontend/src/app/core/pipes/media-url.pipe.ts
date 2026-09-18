import { Pipe, PipeTransform } from "@angular/core";
import { environment } from "../../../environments/environment";

/**
 * The backend stores uploaded image/logo URLs as *relative* paths
 * (e.g. "/uploads/167...-abc.jpg" — see backend/routes/upload.routes.js),
 * served as static files from the API's own origin, not the Angular app's
 * origin. Seed/demo data uses absolute URLs (placehold.co, etc.) which are
 * already fine as-is.
 *
 * Without this pipe, `<img [src]="relativeUploadUrl">` resolves against the
 * frontend's own origin (e.g. http://localhost:4200/uploads/...) instead of
 * the API's (http://localhost:5000/uploads/...), so every real uploaded
 * image 404s and shows as broken — only the seeded placeholder images
 * (which are already absolute URLs) happen to work.
 */
@Pipe({ name: "mediaUrl", standalone: true, pure: true })
export class MediaUrlPipe implements PipeTransform {
  private static readonly apiOrigin = environment.apiUrl.replace(/\/api\/?$/, "");

  transform(url: string | null | undefined): string {
    if (!url) {
      return "";
    }

    if (/^(https?:|data:|blob:)/i.test(url)) {
      return url;
    }

    return `${MediaUrlPipe.apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
  }
}
