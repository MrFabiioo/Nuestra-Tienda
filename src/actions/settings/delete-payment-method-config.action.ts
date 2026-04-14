import { defineAction } from 'astro:actions';
import { PAYMENT_METHODS } from '../../services/orders/constants';
import { requireSensitiveAdminAccess } from '../../firebase/guards';
import { deleteSiteSetting, getManagedPaymentSettingKey } from './payment-settings.shared';
import { managedPaymentMethodSchema } from './save-payment-method-config.action';

export const deletePaymentMethodConfig = defineAction({
  accept: 'json',
  input: managedPaymentMethodSchema,
  handler: async (method, context) => {
    requireSensitiveAdminAccess(context, `eliminar ${method}`);

    await deleteSiteSetting(getManagedPaymentSettingKey(method));

    return {
      ok: true,
      method,
      deleted: method === PAYMENT_METHODS.bancolombia || method === PAYMENT_METHODS.nequi,
    };
  },
});
