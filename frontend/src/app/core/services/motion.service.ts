import { Injectable } from "@angular/core";

/**
 * Central gate for GSAP usage: every animation call in the app should check
 * `canAnimate()` first so prefers-reduced-motion is respected in one place
 * instead of being re-checked in every component.
 */
@Injectable({ providedIn: "root" })
export class MotionService {
  canAnimate(): boolean {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
}
