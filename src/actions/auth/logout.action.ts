/**
 * Logout action — elimina la session cookie del browser.
 *
 * No hay revocación en Firebase porque no usamos Admin SDK.
 * La sesión expirará naturalmente cuando el idToken venza (1 hora).
 *
 * Para el alcance actual (admin personal), esto es suficiente:
 * el logout limpia la cookie inmediatamente en el browser actual.
 * Si necesitas revocar sesiones en otros dispositivos, evalúa migrar a Admin SDK.
 */

import { defineAction } from 'astro:actions';
import { SESSION_COOKIE_NAME } from '../../firebase/config';

export const logout = defineAction({
  accept: 'form',
  handler: async (_input, context) => {
    // Limpiar la cookie — path='/' debe coincidir con el path usado al crearla
    context.cookies.delete(SESSION_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
    });

    return { ok: true };
  },
});
