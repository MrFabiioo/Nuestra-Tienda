/**
 * Firebase — Configuración central.
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  Variables de entorno requeridas                                           │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │  PUBLIC_FIREBASE_API_KEY        → Web API key del proyecto Firebase        │
 * │  PUBLIC_FIREBASE_AUTH_DOMAIN    → <proyecto>.firebaseapp.com               │
 * │  PUBLIC_FIREBASE_PROJECT_ID     → ID del proyecto                         │
 * │  PUBLIC_FIREBASE_STORAGE_BUCKET → <proyecto>.firebasestorage.app          │
 * │  PUBLIC_FIREBASE_MESSAGING_SENDER_ID → Sender ID                          │
 * │  PUBLIC_FIREBASE_APP_ID         → App ID                                  │
 * │  PUBLIC_FIREBASE_MEASUREMENT_ID → Measurement ID (solo para Analytics)    │
 * │                                                                            │
 * │  Cómo obtenerlas:                                                          │
 * │    Firebase Console > Configuración del proyecto > General >               │
 * │    "Tus apps" > Configuración del SDK de Firebase                         │
 * │                                                                            │
 * │  La Web API Key es pública y puede estar en el cliente — Google la         │
 * │  restringe por HTTP Referer e IP desde Firebase Console > Credenciales.   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';

/**
 * Configuración de la app Firebase.
 * Construida desde variables PUBLIC_* para que esté disponible en browser y server.
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey:            import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain:        import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.PUBLIC_FIREBASE_APP_ID,
  measurementId:     import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Inicializa Firebase evitando múltiples instancias.
 * (Importante en SSR/Astro donde el módulo puede evaluarse múltiples veces.)
 */
export const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// ── Cookie de sesión ────────────────────────────────────────────────────────────

/**
 * Nombre de la session cookie.
 * Nombre genérico para no revelar la estrategia de auth a atacantes.
 */
export const SESSION_COOKIE_NAME = '__session';

/**
 * Duración de la sesión en segundos.
 * El idToken de Firebase dura 1 hora. Cookie y token expiran al mismo tiempo.
 */
export const SESSION_COOKIE_MAX_AGE_SECONDS = 10; // 1 hora

// ── URL de public keys ──────────────────────────────────────────────────────────

/**
 * URL de las public keys de Firebase para verificar idTokens localmente.
 * Firebase rota estas claves periódicamente — se cachean según Cache-Control.
 */
export const FIREBASE_PUBLIC_KEYS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
