import { defineAction } from 'astro:actions';
import { db, eq, SiteSettings } from 'astro:db';
import { requireAuth } from '../../firebase/guards';
import { ImageUpload } from '@utils/image-upload';
import { PAYMENT_QR_KEY, type PaymentQrValue } from './get-payment-qr.action';

export const deletePaymentQr = defineAction({
  accept: 'json',
  handler: async (_input, context) => {
    requireAuth(context);

    const [row] = await db
      .select()
      .from(SiteSettings)
      .where(eq(SiteSettings.key, PAYMENT_QR_KEY));

    if (!row) return { ok: true };

    try {
      const qr = JSON.parse(row.value) as PaymentQrValue;
      if (qr.publicId) {
        await ImageUpload.deleteAsset(qr.publicId, 'image');
      }
    } catch { /* ignorar si el JSON está roto */ }

    await db.delete(SiteSettings).where(eq(SiteSettings.key, PAYMENT_QR_KEY));

    return { ok: true };
  },
});
