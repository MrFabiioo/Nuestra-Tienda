export type PaymentProofCleanupTarget = {
  publicId: string;
  resourceType: 'image' | 'raw';
};

export function getPaymentProofCleanupResourceType(mimeType: string): PaymentProofCleanupTarget['resourceType'] {
  return mimeType === 'application/pdf' ? 'raw' : 'image';
}

export function buildPaymentProofCleanupTarget(assetPublicId: string | null | undefined, mimeType: string): PaymentProofCleanupTarget | null {
  if (!assetPublicId || assetPublicId.startsWith('inline')) {
    return null;
  }

  return {
    publicId: assetPublicId,
    resourceType: getPaymentProofCleanupResourceType(mimeType),
  };
}
