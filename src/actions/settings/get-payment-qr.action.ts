import { defineAction } from 'astro:actions';
import { db, eq, SiteSettings } from 'astro:db';

export const PAYMENT_QR_KEY = 'payment_qr_image';

export type PaymentQrValue = {
  url: string;
  publicId: string;
  uploadedAt: string;
};

export const getPaymentQr = defineAction({
  accept: 'json',
  handler: async () => {
    const [row] = await db
      .select()
      .from(SiteSettings)
      .where(eq(SiteSettings.key, PAYMENT_QR_KEY));

    if (!row) return { qr: null };

    try {
      const qr = JSON.parse(row.value) as PaymentQrValue;
      return { qr };
    } catch {
      return { qr: null };
    }
  },
});
