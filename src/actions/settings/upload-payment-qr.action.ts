import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { requireSensitiveAdminAccess } from '../../firebase/guards';
import { ImageUpload } from '@utils/image-upload';
import { PAYMENT_QR_KEY, readPaymentQrSetting, upsertSiteSetting, type PaymentQrValue } from './payment-settings.shared';

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
    requireSensitiveAdminAccess(context, 'subir QR de pago');

    // Si ya hay un QR, eliminar el anterior de Cloudinary
    const existing = await readPaymentQrSetting();

    if (existing) {
      await ImageUpload.deleteAsset(existing.publicId, 'image');
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

    await upsertSiteSetting(PAYMENT_QR_KEY, value);

    return { qr: value };
  },
});
