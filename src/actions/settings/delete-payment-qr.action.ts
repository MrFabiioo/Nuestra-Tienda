import { defineAction } from 'astro:actions';
import { requireSensitiveAdminAccess } from '../../firebase/guards';
import { ImageUpload } from '@utils/image-upload';
import { deleteSiteSetting, PAYMENT_QR_KEY, readPaymentQrSetting } from './payment-settings.shared';

export const deletePaymentQr = defineAction({
  accept: 'json',
  handler: async (_input, context) => {
    requireSensitiveAdminAccess(context, 'eliminar QR de pago');

    const qr = await readPaymentQrSetting();

    if (!qr) return { ok: true };

    await ImageUpload.deleteAsset(qr.publicId, 'image');

    await deleteSiteSetting(PAYMENT_QR_KEY);

    return { ok: true };
  },
});
