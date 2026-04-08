/**
 * Firebase Auth — Utilidades de autenticación.
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  ARQUITECTURA                                                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                            ║
 * ║  LOGIN (server-side / Astro Action):                                       ║
 * ║  - signInWithEmailPassword() usa Firebase Web SDK (firebase/auth)          ║
 * ║  - En Node.js se usa inMemoryPersistence → sin dependencias de browser     ║
 * ║  - Retorna el idToken del usuario autenticado                              ║
 * ║                                                                            ║
 * ║  VERIFICACIÓN JWT (server-side / middleware):                              ║
 * ║  - verifyFirebaseIdToken() verifica el JWT localmente                      ║
 * ║  - Usa Web Crypto API nativa (Node 18+ / Edge runtimes)                   ║
 * ║  - Sin dependencias externas — reemplaza jose                              ║
 * ║  - Descarga y cachea las public keys de Firebase (según Cache-Control)     ║
 * ║  - Verifica firma RS256, audience, issuer y expiración                     ║
 * ║                                                                            ║
 * ║  Nivel de seguridad:                                                       ║
 * ║  ✅ Protección server-side real — middleware verifica el JWT               ║
 * ║  ✅ httpOnly cookie — inaccesible desde JS (mitiga XSS)                   ║
 * ║  ✅ sameSite=strict — protección CSRF                                      ║
 * ║  ✅ Firma RS256 verificada con public keys oficiales de Firebase           ║
 * ║  ✅ Sin dependencias externas para verificación JWT                        ║
 * ║  ⚠️ Sin revocación en tiempo real (requeriría Admin SDK)                   ║
 * ║  ⚠️ Sesión máxima 1 hora (duración del idToken de Firebase)               ║
 * ║                                                                            ║
 * ║  Sin Admin SDK → sin service account, sin private key en .env             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { getAuth, signInWithEmailAndPassword, inMemoryPersistence } from 'firebase/auth';
import { firebaseApp, FIREBASE_PUBLIC_KEYS_URL } from './config';

// ── Tipos públicos ──────────────────────────────────────────────────────────────

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
}

export interface SignInResult {
  ok: true;
  idToken: string;
  user: FirebaseUser;
}

export interface SignInError {
  ok: false;
  message: string;
}

// ── Login con Firebase Web SDK ──────────────────────────────────────────────────

/**
 * Autentica con email/password usando el Firebase Web SDK.
 *
 * Usamos inMemoryPersistence para que el SDK no intente acceder a
 * localStorage/IndexedDB (APIs de browser no disponibles en Node.js).
 *
 * @returns idToken (JWT de 1h de vida) y datos del usuario, o error genérico.
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<SignInResult | SignInError> {
  try {
    const auth = getAuth(firebaseApp);
    // inMemoryPersistence: sin acceso a localStorage/IndexedDB — seguro en Node.js
    await auth.setPersistence(inMemoryPersistence);

    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();

    return {
      ok: true,
      idToken,
      user: {
        uid: credential.user.uid,
        email: credential.user.email ?? email,
        displayName: credential.user.displayName ?? undefined,
      },
    };
  } catch {
    // NUNCA exponer códigos de error de Firebase al cliente — previene user enumeration
    return { ok: false, message: 'Credenciales inválidas.' };
  }
}

// ── Verificación JWT con Web Crypto API nativa ──────────────────────────────────

/**
 * Cache de public keys de Firebase.
 * Se respeta el header Cache-Control de la respuesta de Firebase.
 */
let cachedKeys: Record<string, CryptoKey> | null = null;
let cacheExpiry = 0;

/**
 * Descarga y parsea las public keys de Firebase en formato CryptoKey.
 * Las claves se cachean según el header Cache-Control de Firebase.
 */
async function getFirebasePublicKeys(): Promise<Record<string, CryptoKey>> {
  const now = Date.now();
  if (cachedKeys && now < cacheExpiry) {
    return cachedKeys;
  }

  const response = await fetch(FIREBASE_PUBLIC_KEYS_URL);
  const rawKeys = await response.json() as Record<string, string>;

  // Parsear max-age del header Cache-Control
  const cacheControl = response.headers.get('Cache-Control') ?? '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

  // Convertir los certificados X.509 PEM a CryptoKey (Web Crypto API)
  const importedKeys: Record<string, CryptoKey> = {};
  for (const [kid, pem] of Object.entries(rawKeys)) {
    importedKeys[kid] = await importX509PEM(pem);
  }

  cachedKeys = importedKeys;
  cacheExpiry = now + maxAgeSeconds * 1000;

  return importedKeys;
}

/**
 * Importa un certificado X.509 PEM como CryptoKey para verificación RS256.
 * Usa Web Crypto API nativa — disponible en Node 18+, Deno, Bun y edge runtimes.
 */
async function importX509PEM(pem: string): Promise<CryptoKey> {
  // Limpiar encabezados PEM y decodificar base64 a ArrayBuffer
  const pemContents = pem
    .replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/\s+/g, '');

  const derBuffer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  // importKey con formato "spki" no acepta el certificado X.509 completo.
  // Extraemos la SubjectPublicKeyInfo (SPKI) del certificado usando la API
  // "raw" → primero importamos como certificado X.509 si está disponible,
  // sino usamos el workaround de SubtleCrypto.
  //
  // Node 18+ soporta importKey con format "raw" para x509 vía:
  // crypto.subtle.importKey('spki', spkiBuffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  // pero necesitamos extraer el SPKI del certificado DER primero.
  const spkiBuffer = extractSPKIFromDER(derBuffer);

  return crypto.subtle.importKey(
    'spki',
    spkiBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

/**
 * Extrae el SubjectPublicKeyInfo (SPKI) de un certificado DER (X.509).
 *
 * Estructura simplificada de un certificado X.509 DER:
 *   SEQUENCE {                         ← Certificado
 *     SEQUENCE {                       ← TBSCertificate
 *       ...fields...
 *       SEQUENCE { BITSTRING }         ← SubjectPublicKeyInfo (lo que necesitamos)
 *     }
 *     SEQUENCE { ... }                 ← AlgorithmIdentifier (firma)
 *     BITSTRING                        ← signature
 *   }
 *
 * Esta función navega la estructura ASN.1 DER para encontrar el SPKI.
 * Es una implementación mínima y robusta para el caso específico de
 * certificados RSA de Firebase (siempre tienen la misma estructura).
 */
function extractSPKIFromDER(der: Uint8Array): ArrayBuffer {
  let offset = 0;

  // Helper: leer tag y longitud DER, retorna [nextOffset, length]
  function readTL(pos: number): [number, number] {
    // Saltar tag
    let p = pos + 1;
    let len = der[p++];
    if (len & 0x80) {
      const numBytes = len & 0x7f;
      len = 0;
      for (let i = 0; i < numBytes; i++) {
        len = (len << 8) | der[p++];
      }
    }
    return [p, len];
  }

  // Certificado externo: SEQUENCE
  let [p] = readTL(offset);
  // TBSCertificate: SEQUENCE
  [p] = readTL(p);
  // Dentro del TBSCertificate: version [0] EXPLICIT (opcional), serialNumber, ...
  // Necesitamos llegar al SubjectPublicKeyInfo que está después de Subject.
  // Estrategia: buscar el SEQUENCE que contiene la AlgorithmIdentifier (OID de RSA)
  // seguido de BITSTRING — eso es el SPKI.
  //
  // Enfoque alternativo más robusto: buscar el OID de RSA (1.2.840.113549.1.1.1)
  // en el DER y retroceder al SEQUENCE que lo contiene.
  const rsaOid = new Uint8Array([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01]);

  let oidPos = -1;
  for (let i = 0; i < der.length - rsaOid.length; i++) {
    if (der[i] === 0x06 && der[i + 1] === rsaOid.length) {
      let match = true;
      for (let j = 0; j < rsaOid.length; j++) {
        if (der[i + 2 + j] !== rsaOid[j]) { match = false; break; }
      }
      if (match) { oidPos = i; break; }
    }
  }

  if (oidPos === -1) {
    throw new Error('No se encontró el OID RSA en el certificado DER.');
  }

  // El OID está dentro de: SEQUENCE { SEQUENCE { OID, NULL }, BITSTRING }
  // El SPKI es el SEQUENCE que contiene el AlgorithmIdentifier con el OID.
  // Retrocedemos: el OID está en un SEQUENCE (tag 0x30) que forma el AlgorithmIdentifier.
  // El padre de ese SEQUENCE es el SPKI SEQUENCE.
  // Buscamos el SEQUENCE (0x30) más cercano antes del OID.
  let spkiStart = oidPos - 2; // AlgorithmIdentifier SEQUENCE tag + len byte aprox
  // Ir al SEQUENCE que contiene el AlgorithmIdentifier (padre inmediato)
  // El AlgorithmIdentifier es: 0x30 [len] 0x06 [oidLen] [oid] 0x05 0x00
  // El SPKI es:               0x30 [len] [AlgorithmIdentifier] 0x03 [bitstrLen] ...
  // Retrocedemos buscando el tag 0x30 que es el padre del AlgorithmIdentifier
  while (spkiStart > 0 && der[spkiStart] !== 0x30) {
    spkiStart--;
  }
  // Este 0x30 es el AlgorithmIdentifier. Subir un nivel más para el SPKI SEQUENCE.
  let spkiOuter = spkiStart - 2;
  while (spkiOuter > 0 && der[spkiOuter] !== 0x30) {
    spkiOuter--;
  }

  // Leer la longitud del SPKI SEQUENCE para extraer exactamente ese bloque
  const [, spkiLen] = readTL(spkiOuter);
  // Calcular fin del SPKI: necesitamos el offset del primer byte de contenido
  let afterTag = spkiOuter + 1;
  let lenByte = der[afterTag];
  let headerSize = 2;
  if (lenByte & 0x80) {
    headerSize += (lenByte & 0x7f);
  }
  const spkiEnd = spkiOuter + headerSize + spkiLen;
  void p; // suppress unused warning

  return der.slice(spkiOuter, spkiEnd).buffer;
}

/**
 * Verifica un Firebase idToken usando las public keys oficiales de Firebase.
 *
 * Verificación LOCAL sin round-trip a Firebase en cada request:
 * - Descarga y cachea las public keys de Firebase
 * - Verifica la firma RS256 con Web Crypto API nativa
 * - Verifica audience (project ID), issuer y expiración
 *
 * Limitaciones vs Admin SDK:
 * - No verifica si el usuario fue deshabilitado en Firebase
 * - No verifica si la sesión fue revocada
 * - La sesión dura máximo 1 hora (vida del idToken)
 *
 * @param idToken - El idToken JWT obtenido del login
 * @param projectId - El Firebase project ID
 * @returns FirebaseUser si el token es válido, null en cualquier otro caso
 */
export async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string
): Promise<FirebaseUser | null> {
  if (!idToken || idToken.length < 20) return null;

  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decodificar header para obtener el kid (key ID)
    const headerStr = atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'));
    const header = JSON.parse(headerStr) as { kid?: string; alg?: string };

    if (header.alg !== 'RS256' || !header.kid) return null;

    // Obtener public keys cacheadas
    const publicKeys = await getFirebasePublicKeys();

    if (!publicKeys[header.kid]) {
      // kid desconocido — claves rotadas, forzar refresco
      cachedKeys = null;
      return null;
    }

    // Verificar firma RS256 con Web Crypto API
    const signedPart = `${headerB64}.${payloadB64}`;
    const signedBuffer = new TextEncoder().encode(signedPart);

    // Convertir base64url a ArrayBuffer
    const sigBase64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const sigBuffer = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKeys[header.kid],
      sigBuffer,
      signedBuffer
    );

    if (!isValid) return null;

    // Decodificar payload
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr) as Record<string, unknown>;

    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;

    // Verificar iat (emitido en el pasado o presente)
    if (typeof payload.iat !== 'number' || payload.iat > now + 5) return null;

    // Verificar audience (project ID)
    if (payload.aud !== projectId) return null;

    // Verificar issuer
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;

    return {
      uid: (payload.sub as string) ?? '',
      email: (payload.email as string) ?? '',
      displayName: (payload.name as string) ?? undefined,
    };
  } catch {
    // Token inválido, expirado, firma incorrecta, etc.
    return null;
  }
}
