/**
 * Firebase Analytics — Inicialización browser-only.
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  IMPORTANTE: Este módulo es EXCLUSIVAMENTE para el browser.               ║
 * ║                                                                            ║
 * ║  firebase/analytics requiere APIs de browser:                             ║
 * ║  - IndexedDB (para persistencia interna)                                  ║
 * ║  - navigator.cookieEnabled                                                 ║
 * ║  - window / document                                                       ║
 * ║                                                                            ║
 * ║  NO importes este módulo desde middleware, Astro Actions ni ningún         ║
 * ║  archivo que corra en Node.js / server-side.                              ║
 * ║                                                                            ║
 * ║  Uso correcto: importar desde un script con client:only o desde un        ║
 * ║  <script> tag en un layout .astro usando is:inline o import dinámico.     ║
 * ║                                                                            ║
 * ║  isSupported() verifica antes de inicializar — maneja entornos sin        ║
 * ║  cookies, extensiones de browser que bloquean Analytics, etc.             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * Fuente oficial: https://firebase.google.com/docs/analytics/get-started?platform=web
 */

import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseApp } from './config';

/**
 * Inicializa Firebase Analytics solo si el entorno lo soporta.
 *
 * - Usa isSupported() para evitar errores en SSR o entornos sin cookies.
 * - Retorna la instancia de Analytics o null si no es soportado.
 *
 * @example
 * // En un <script> de un layout Astro:
 * import { initAnalytics } from '../firebase/analytics';
 * initAnalytics();
 */
export async function initAnalytics() {
  const supported = await isSupported();
  if (!supported) return null;

  return getAnalytics(firebaseApp);
}
