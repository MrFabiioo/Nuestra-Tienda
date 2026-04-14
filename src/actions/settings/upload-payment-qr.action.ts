import { defineAction } from 'astro:actions';
import { db, eq, SiteSettings } from 'astro:db';
import { z } from 'astro:schema';
import { requireAuth } from '../../firebase/guards';
import { ImageUpload } from '@utils/image-upload';
import { PAYMENT_QR_KEY, type PaymentQrValue } from './get-payment-qr.action';

export const uploadPaymentQr = defineAction({
  accept: 'form',
  input: z.object({
    qrFile: z
      .instanceof(File)
      .refine((f) => f.size > 0, 'Seleccioná una imagen.')
      .refine((f) => f.size <= 4 * 1024 * 1024, 'La imagen no puede pesar más de 4MB.')
      .refine(
        (f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
        'Solo se aceptan imágenes JPG, PNG o WEBP.',
      ),
  }),
  handler: async (input, context) => {
    requireAuth(context);

    // Si ya hay un QR, eliminar el anterior de Cloudinary
    const [existing] = await db
      .select()
      .from(SiteSettings)
      .where(eq(SiteSettings.key, PAYMENT_QR_KEY));

    if (existing) {
      try {
        const prev = JSON.parse(existing.value) as PaymentQrValue;
        if (prev.publicId) {
          await ImageUpload.deleteAsset(prev.publicId, 'image');
        }
      } catch { /* si el JSON está roto, ignorar */ }
    }

    const asset = await ImageUpload.uploadDetailed(input.qrFile, {
      folder: 'site-settings',
      publicIdPrefix: 'payment-qr',
    });

    const value: PaymentQrValue = {
      url: asset.secureUrl,
      publicId: asset.publicId,
      uploadedAt: new Date().toISOString(),
    };

    await db
      .insert(SiteSettings)
      .values({ key: PAYMENT_QR_KEY, value: JSON.stringify(value), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: SiteSettings.columns.key,
        set: { value: JSON.stringify(value), updatedAt: new Date() },
      });

    return { qr: value };
  },
});
