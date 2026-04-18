const PRODUCT_FALLBACK_LABEL = 'Guacamole Shop';

type PlaceholderOptions = {
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  subtitle?: string;
};

function encodeSvg(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function createBrandedPlaceholderImage(label: string, options: PlaceholderOptions = {}) {
  const {
    accentColor = '#7BA428',
    backgroundColor = '#F4F8EC',
    textColor = '#173F2A',
    subtitle = 'Imagen temporal mientras se completa la migración de assets.',
  } = options;

  const safeLabel = escapeHtml(label.trim() || PRODUCT_FALLBACK_LABEL);
  const safeSubtitle = escapeHtml(subtitle.trim());

  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="${safeLabel}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${backgroundColor}" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" rx="36" />
      <circle cx="180" cy="160" r="72" fill="${accentColor}" fill-opacity="0.16" />
      <circle cx="1030" cy="760" r="110" fill="${accentColor}" fill-opacity="0.12" />
      <rect x="124" y="124" width="952" height="652" rx="44" fill="#ffffff" fill-opacity="0.86" stroke="${accentColor}" stroke-opacity="0.22" />
      <path d="M442 348c0-84 68-152 152-152s152 68 152 152v11c0 75-54 138-126 153l42 58h-125l42-58c-72-15-137-78-137-164Z" fill="${accentColor}" fill-opacity="0.92" />
      <text x="600" y="646" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700" fill="${textColor}">${safeLabel}</text>
      <text x="600" y="708" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${textColor}" fill-opacity="0.74">${safeSubtitle}</text>
    </svg>
  `.replace(/\s{2,}/g, ' ').trim());
}

export const PRODUCT_IMAGE_FALLBACK_URL = createBrandedPlaceholderImage(PRODUCT_FALLBACK_LABEL);

export function isHttpImageUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function isInlineImageUrl(value: string) {
  return value.startsWith('data:');
}

function isLegacyPublicImageReference(value: string) {
  return value.startsWith('/images/') || /^[^/]+\.[a-z0-9]+$/i.test(value);
}

export function resolveProductImageUrl(source?: string | null, options?: { fallback?: string; baseUrl?: string | URL }) {
  const fallback = options?.fallback ?? PRODUCT_IMAGE_FALLBACK_URL;
  const trimmed = source?.trim();

  if (!trimmed) {
    return fallback;
  }

  if (isHttpImageUrl(trimmed) || isInlineImageUrl(trimmed)) {
    return trimmed;
  }

  if (isLegacyPublicImageReference(trimmed)) {
    return fallback;
  }

  if (trimmed.startsWith('/')) {
    if (!options?.baseUrl) {
      return trimmed;
    }

    try {
      return new URL(trimmed, options.baseUrl).toString();
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export function resolveProductImageList(images?: string[] | string | null, options?: { fallback?: string; baseUrl?: string | URL }) {
  const list = Array.isArray(images)
    ? images
    : typeof images === 'string'
      ? images.split(',')
      : [];

  const resolved = list
    .map((image) => resolveProductImageUrl(image, options))
    .filter(Boolean);

  return resolved.length > 0 ? resolved : [options?.fallback ?? PRODUCT_IMAGE_FALLBACK_URL];
}

export function resolveSocialImageUrl(source?: string | null, baseUrl?: string | URL) {
  const resolved = resolveProductImageUrl(source, { fallback: '', baseUrl });

  if (!resolved || isInlineImageUrl(resolved)) {
    return undefined;
  }

  if (isHttpImageUrl(resolved)) {
    return resolved;
  }

  if (resolved.startsWith('/')) {
    try {
      return baseUrl ? new URL(resolved, baseUrl).toString() : resolved;
    } catch {
      return undefined;
    }
  }

  return undefined;
}
