/**
 * Server-side auth guards for Astro Action handlers.
 *
 * Usage:
 *   import { requireAuth } from '../../firebase/guards';
 *
 *   handler: async (input, context) => {
 *     const user = requireAuth(context);
 *     // user is guaranteed to be defined here
 *   }
 *
 * The middleware already validates the session token and sets context.locals.user
 * on every request. These guards provide a second layer of protection for
 * individual action handlers, preventing bypass via direct POST requests
 * to the /_actions/* endpoints.
 *
 * Security note:
 * The middleware runs on page requests. Action handlers are called via
 * /_actions/* which also runs through middleware (Astro 5). However,
 * explicit guards in action handlers provide defense-in-depth.
 */

import { ActionError } from 'astro:actions';
import type { ActionAPIContext } from 'astro:actions';

const ADMIN_EMAIL_FALLBACKS = [
  import.meta.env.ADMIN_ALLOWED_EMAILS,
  import.meta.env.ORDER_NOTIFICATIONS_ADMIN_EMAIL,
].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getSensitiveAdminEmailAllowlist() {
  return new Set(
    ADMIN_EMAIL_FALLBACKS
      .flatMap((value) => value.split(','))
      .map(normalizeEmail)
      .filter(Boolean),
  );
}

/**
 * Asserts the request is authenticated.
 * Throws ActionError(UNAUTHORIZED) if context.locals.user is not set.
 * Returns the user if authenticated.
 */
export function requireAuth(context: ActionAPIContext) {
  const user = context.locals.user;
  if (!user) {
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: 'Acceso no autorizado. Iniciá sesión para continuar.',
    });
  }
  return user;
}

export function canManageSensitiveAdminActions(email: string | undefined) {
  if (!email) return false;

  const allowlist = getSensitiveAdminEmailAllowlist();
  if (allowlist.size === 0) return false;

  return allowlist.has(normalizeEmail(email));
}

export function requireSensitiveAdminAccess(context: ActionAPIContext, capability = 'realizar esta acción sensible') {
  const user = requireAuth(context);

  if (!canManageSensitiveAdminActions(user.email)) {
    throw new ActionError({
      code: 'FORBIDDEN',
      message: `Tu usuario no tiene permisos para ${capability}. Configurá ADMIN_ALLOWED_EMAILS (o ORDER_NOTIFICATIONS_ADMIN_EMAIL como fallback) con los correos habilitados.`,
    });
  }

  return user;
}
