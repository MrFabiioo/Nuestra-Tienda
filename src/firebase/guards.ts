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
