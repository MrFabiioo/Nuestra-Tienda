/**
 * Astro Middleware — Protección de rutas /admin/*.
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  MODELO DE SEGURIDAD                                                       ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                            ║
 * ║  1. Cada request a /admin/* (excepto /admin/login y /admin/logout)         ║
 * ║     valida el idToken almacenado en la cookie httpOnly.                    ║
 * ║                                                                            ║
 * ║  2. verifyFirebaseIdToken():                                               ║
 * ║     - Descarga y cachea las public keys de Firebase                       ║
 * ║     - Verifica la firma RS256 del JWT localmente (sin round-trip)         ║
 * ║     - Verifica audience, issuer y expiración                              ║
 * ║                                                                            ║
 * ║  3. El usuario decodificado se almacena en context.locals.user             ║
 * ║     → accesible en .astro pages y action handlers                         ║
 * ║                                                                            ║
 * ║  4. Requests no autenticados → redirect a /admin/login                    ║
 * ║                                                                            ║
 * ║  5. Páginas admin → Cache-Control: no-store para prevenir caché de        ║
 * ║     contenido sensible en proxies o el browser.                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { defineMiddleware } from 'astro:middleware';
import { verifyFirebaseIdToken } from './firebase/auth';
import { SESSION_COOKIE_NAME } from './firebase/config';

const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_LOGOUT_PATH = '/admin/logout';
const ADMIN_DEFAULT_PATH = '/admin/dashboard';

/** Rutas bajo /admin/* que no requieren autenticación */
const PUBLIC_ADMIN_PATHS = new Set([ADMIN_LOGIN_PATH, ADMIN_LOGOUT_PATH]);

/** Actions del admin que requieren sesión válida */
const PROTECTED_ADMIN_ACTIONS = new Set([
  'createUpdateProduct',
  'deleteProduct',
  'deleteProductImage',
  'updateProductImagesMeta',
  'toggleFeatured',
  'toggleEnabled',
  'getCategories',
  'createUpdateCategory',
  'deleteCategory',
  'getOrders',
  'reviewPayment',
  'deleteOrder',
  'getAnalytics',
  'uploadPaymentQr',
  'deletePaymentQr',
  'savePaymentMethodConfig',
  'deletePaymentMethodConfig',
]);

/**
 * Valida un redirect target para prevenir open redirect attacks.
 * Solo paths que empiezan con /admin/ son permitidos.
 */
function safeAdminRedirect(raw: string | null): string {
  if (!raw) return ADMIN_DEFAULT_PATH;
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
      return ADMIN_DEFAULT_PATH;
    }
    if (raw.startsWith('/admin/') && !raw.includes('..')) {
      return raw;
    }
  } catch {
    // fall through
  }
  return ADMIN_DEFAULT_PATH;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAdminPageRequest = pathname.startsWith('/admin');

  // Extraer nombre de action desde la URL — es confiable siempre.
  // getActionContext puede devolver undefined con FormData multipart.
  const actionNameFromUrl = pathname.startsWith('/_actions/')
    ? decodeURIComponent(pathname.slice('/_actions/'.length)).split('/')[0]
    : null;
  const isProtectedAdminAction = !!actionNameFromUrl && PROTECTED_ADMIN_ACTIONS.has(actionNameFromUrl);

  // Solo procesar páginas admin y actions protegidas del admin
  if (!isAdminPageRequest && !isProtectedAdminAction) {
    return next();
  }

  const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID as string | undefined;

  // Si el project ID no está configurado, bloquear el área admin con mensaje claro
  if (!projectId) {
    if (pathname === ADMIN_LOGIN_PATH) {
      return next();
    }
    return new Response(
      'Error de configuración: PUBLIC_FIREBASE_PROJECT_ID no está definido. ' +
        'Obtenerlo en Firebase Console > Configuración del proyecto > General > "ID del proyecto".',
      { status: 503 }
    );
  }

  const sessionCookie = context.cookies.get(SESSION_COOKIE_NAME)?.value;

  // ── Paths públicos de admin (login, logout) ──────────────────────────────────
  if (isAdminPageRequest && PUBLIC_ADMIN_PATHS.has(pathname)) {
    if (pathname === ADMIN_LOGOUT_PATH) {
      return next();
    }

    // /admin/login: si ya está autenticado, redirigir al dashboard
    if (pathname === ADMIN_LOGIN_PATH && sessionCookie) {
      const user = await verifyFirebaseIdToken(sessionCookie, projectId);
      if (user) {
        context.locals.user = user;
        return context.redirect(ADMIN_DEFAULT_PATH);
      }
      // Token inválido/expirado → limpiar cookie y mostrar login
      context.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
    }
    return next();
  }

  // ── Ruta admin protegida ─────────────────────────────────────────────────────
  if (!sessionCookie) {
    if (isProtectedAdminAction) {
      return next();
    }
    const encodedRedirect = encodeURIComponent(pathname);
    return context.redirect(`${ADMIN_LOGIN_PATH}?redirect=${encodedRedirect}`);
  }

  const user = await verifyFirebaseIdToken(sessionCookie, projectId);

  if (!user) {
    // Token inválido o expirado → limpiar cookie y redirigir al login
    context.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
    if (isProtectedAdminAction) {
      return next();
    }
    const encodedRedirect = encodeURIComponent(pathname);
    return context.redirect(`${ADMIN_LOGIN_PATH}?redirect=${encodedRedirect}`);
  }

  // ── Autenticado ───────────────────────────────────────────────────────────────
  context.locals.user = user;

  const response = await next();

  // Prevenir caché de páginas admin en proxies/browsers
  if (isAdminPageRequest) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Vary', 'Cookie');
  }

  return response;
});
