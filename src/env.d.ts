/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ADMIN_ALLOWED_EMAILS?: string;
  readonly ORDER_NOTIFICATIONS_ADMIN_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
