/**
 * Login action — autentica con Firebase Web SDK y almacena el idToken
 * en una httpOnly cookie del servidor.
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  FLUJO                                                                     ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  1. Validación de input con Zod (email + password)                        ║
 * ║  2. signInWithEmailPassword() → Firebase Web SDK → idToken (1h de vida)    ║
 * ║  3. Almacenar el idToken en una httpOnly cookie                            ║
 * ║                                                                            ║
 * ║  Atributos de la cookie:                                                   ║
 * ║  - httpOnly: inaccesible desde JS (mitiga XSS)                            ║
 * ║  - secure: solo HTTPS en producción                                       ║
 * ║  - sameSite=strict: protección CSRF                                       ║
 * ║  - path=/: necesario para que la cookie llegue a /_actions/* de Astro     ║
 * ║  - maxAge=3600: expira junto con el idToken (1 hora)                      ║
 * ║                                                                            ║
 * ║  Errores genéricos: nunca se exponen códigos de error de Firebase          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { signInWithEmailPassword } from '../../firebase/auth';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS } from '../../firebase/config';

export const login = defineAction({
  accept: 'form',
  input: z.object({
    email: z
      .string()
      .min(1, 'El email es requerido.')
      .email('El email no es válido.'),
    password: z
      .string()
      .min(1, 'La contraseña es requerida.')
      .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  }),
  handler: async ({ email, password }, context) => {
    // Autenticar con Firebase Web SDK
    const signInResult = await signInWithEmailPassword(email, password);

    if (!signInResult.ok) {
      // Mensaje genérico — previene enumeración de usuarios
      throw new ActionError({
        code: 'UNAUTHORIZED',
        message: 'Credenciales inválidas. Revisá tu email y contraseña.',
      });
    }

    const isProduction = import.meta.env.PROD;

    // Almacenar el idToken en una httpOnly cookie
    // - path='/' es necesario porque las Astro actions se llaman via /_actions/*
    //   y una cookie con path='/admin' no se enviaría en esos requests
    // - sameSite='strict' compensa la amplitud del path con protección CSRF
    context.cookies.set(SESSION_COOKIE_NAME, signInResult.idToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });

    return { ok: true, email: signInResult.user.email };
  },
});
