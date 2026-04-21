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
import { isAdminEmailAllowed } from './admin-access';

function getAdminAllowedEmailsEnv() {
  return (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.ADMIN_ALLOWED_EMAILS;
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

export function canAccessAdmin(email: string | undefined) {
  return isAdminEmailAllowed(email, getAdminAllowedEmailsEnv());
}

export function hasAdminAccess(context: ActionAPIContext) {
  return canAccessAdmin(context.locals.user?.email);
}

export function requireAdminAccess(context: ActionAPIContext, capability = 'acceder al panel admin') {
  const user = requireAuth(context);

  if (!canAccessAdmin(user.email)) {
    throw new ActionError({
      code: 'FORBIDDEN',
      message: `Tu usuario no tiene permisos para ${capability}. Configurá ADMIN_ALLOWED_EMAILS con los correos habilitados.`,
    });
  }

  return user;
}

export function canManageSensitiveAdminActions(email: string | undefined) {
  return canAccessAdmin(email);
}

export function requireSensitiveAdminAccess(context: ActionAPIContext, capability = 'realizar esta acción sensible') {
  return requireAdminAccess(context, capability);
}

export function requireProductDeletable(orderItemCount: number) {
  if (orderItemCount > 0) {
    throw new ActionError({
      code: 'FORBIDDEN',
      message: 'No se puede eliminar este producto porque ya tiene pedidos asociados. Deshabilitalo desde el panel para ocultarlo sin romper el historial.',
    });
  }
}
