/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ADMIN_ALLOWED_EMAILS?: string;
  readonly ASTRO_DB_APP_TOKEN?: string;
  readonly ASTRO_DB_REMOTE_URL?: string;
  readonly CLOUDINARY_API_KEY?: string;
  readonly CLOUDINARY_API_SECRET?: string;
  readonly CLOUDINARY_CLOUD_NAME?: string;
  readonly ORDER_NOTIFICATIONS_ADMIN_EMAIL?: string;
  readonly ORDER_NOTIFICATIONS_ADMIN_WHATSAPP?: string;
  readonly ORDER_NOTIFICATIONS_WHATSAPP_ENABLED?: 'true' | 'false';
  readonly ORDER_PUBLIC_TOKEN_SECRET?: string;
  readonly PUBLIC_FIREBASE_API_KEY?: string;
  readonly PUBLIC_FIREBASE_APP_ID?: string;
  readonly PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  readonly PUBLIC_FIREBASE_MEASUREMENT_ID?: string;
  readonly PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID?: string;
  readonly PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  readonly PUBLIC_URL?: string;
  readonly RESEND_API_KEY?: string;
  readonly RESEND_DEV_TO_OVERRIDE?: string;
  readonly RESEND_FROM_EMAIL?: string;
  readonly RESEND_FROM_NAME?: string;
  readonly WHATSAPP_CLOUD_API_TOKEN?: string;
  readonly WHATSAPP_CLOUD_PHONE_NUMBER_ID?: string;
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
