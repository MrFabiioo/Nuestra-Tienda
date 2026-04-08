/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /**
     * Populated by middleware on every authenticated /admin/* request.
     * undefined on public routes or when session is invalid.
     */
    user?: {
      uid: string;
      email: string;
      displayName?: string;
    };
  }
}
