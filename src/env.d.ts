/// <reference types="astro/client" />

interface Window {
  /** Set by the main script; the inline failsafe in <head> checks it. */
  __booted?: boolean;
}
