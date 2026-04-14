import { defineAction } from 'astro:actions';
import { PAYMENT_METHODS } from '../../services/orders/constants';
import { readPaymentSettingsSnapshot } from './payment-settings.shared';

export const getPaymentSettings = defineAction({
  accept: 'json',
  handler: async () => {
    const settings = await readPaymentSettingsSnapshot();
    const availableMethods: Array<typeof PAYMENT_METHODS.bancolombia | typeof PAYMENT_METHODS.nequi | typeof PAYMENT_METHODS.qr> = [];

    if (settings.bancolombia) {
      availableMethods.push(PAYMENT_METHODS.bancolombia);
    }

    if (settings.nequi) {
      availableMethods.push(PAYMENT_METHODS.nequi);
    }

    if (settings.qr) {
      availableMethods.push(PAYMENT_METHODS.qr);
    }

    return {
      ...settings,
      availableMethods,
    };
  },
});
