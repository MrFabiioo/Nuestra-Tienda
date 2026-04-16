import { defineAction } from 'astro:actions';
import { readPaymentQrSetting } from './payment-settings.shared';

export const getPaymentQr = defineAction({
  accept: 'json',
  handler: async () => {
    const qr = await readPaymentQrSetting();
    return { qr };
  },
});
