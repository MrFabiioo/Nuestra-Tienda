export const BRAND_NAME = 'Guacamole Shop';
export const DEFAULT_OG_IMAGE_PATH: string | undefined = undefined;

const LEGACY_BRAND_TOKENS = [BRAND_NAME, 'Nuestra Tienda'];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildPageTitle(title?: string) {
  const trimmedTitle = title?.trim();

  if (!trimmedTitle) {
    return BRAND_NAME;
  }

  let cleanTitle = trimmedTitle;

  for (const token of LEGACY_BRAND_TOKENS) {
    const tokenPattern = new RegExp(`\\s*(?:[|\\-—·:]\\s*)?${escapeRegExp(token)}\\s*$`, 'i');
    cleanTitle = cleanTitle.replace(tokenPattern, '').trim();
  }

  if (!cleanTitle || cleanTitle.toLowerCase() === BRAND_NAME.toLowerCase()) {
    return BRAND_NAME;
  }

  return `${cleanTitle} | ${BRAND_NAME}`;
}

export function isSensitiveSeoPath(pathname: string) {
  return pathname.startsWith('/admin') || pathname === '/checkout' || pathname.startsWith('/checkout/') || pathname === '/pagos' || pathname.startsWith('/pagos/');
}

export function getSiteOrigin(currentUrl?: URL) {
  const configuredPublicUrl = import.meta.env.PUBLIC_URL?.trim();

  if (configuredPublicUrl) {
    try {
      return new URL(configuredPublicUrl);
    } catch {
      // Ignore invalid PUBLIC_URL and fall back to request origin.
    }
  }

  if (currentUrl?.origin) {
    try {
      return new URL(currentUrl.origin);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function toAbsoluteUrl(pathOrUrl: string | undefined, base: URL | undefined) {
  if (!pathOrUrl) {
    return undefined;
  }

  try {
    return new URL(pathOrUrl);
  } catch {
    if (!base) {
      return undefined;
    }

    try {
      return new URL(pathOrUrl, base);
    } catch {
      return undefined;
    }
  }
}
