export function normalizeProductSizes(sizes: Iterable<unknown>): string[] {
  const uniqueSizes = new Set<string>();

  for (const size of sizes) {
    const normalizedSize = String(size ?? '').trim();
    if (!normalizedSize) continue;
    uniqueSizes.add(normalizedSize);
  }

  return Array.from(uniqueSizes);
}

export function parseProductSizes(raw: string | null | undefined): string[] {
  return normalizeProductSizes((raw ?? '').split(','));
}

export function serializeProductSizes(
  sizes: Iterable<unknown> | string | null | undefined,
): string {
  if (typeof sizes === 'string' || sizes == null) {
    return parseProductSizes(sizes).join(',');
  }

  return normalizeProductSizes(sizes).join(',');
}
