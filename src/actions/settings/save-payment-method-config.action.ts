import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { PAYMENT_METHODS } from '../../services/orders/constants';
import { requireSensitiveAdminAccess } from '../../firebase/guards';
import {
  getManagedPaymentSettingKey,
  upsertSiteSetting,
  type BancolombiaPaymentValue,
  type NequiPaymentValue,
} from './payment-settings.shared';

const managedPaymentMethodSchema = z.enum([PAYMENT_METHODS.bancolombia, PAYMENT_METHODS.nequi]);

const bancolombiaSchema = z.object({
  accountType: z.string().trim().min(2, 'Indicá el tipo de cuenta.'),
  accountNumber: z.string().trim().min(5, 'Indicá el número de cuenta.'),
  holderName: z.string().trim().min(2, 'Indicá el titular.'),
  note: z.string().trim().max(160, 'La nota no puede superar los 160 caracteres.').optional().or(z.literal('')),
});

const nequiSchema = z.object({
  phoneNumber: z.string().trim().min(7, 'Indicá el celular asociado a Nequi.'),
  holderName: z.string().trim().min(2, 'Indicá el titular.'),
  note: z.string().trim().max(160, 'La nota no puede superar los 160 caracteres.').optional().or(z.literal('')),
});

const inputSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal(PAYMENT_METHODS.bancolombia),
    data: bancolombiaSchema,
  }),
  z.object({
    method: z.literal(PAYMENT_METHODS.nequi),
    data: nequiSchema,
  }),
]);

export const savePaymentMethodConfig = defineAction({
  accept: 'json',
  input: inputSchema,
  handler: async (input, context) => {
    requireSensitiveAdminAccess(context, `configurar ${input.method}`);

    if (input.method === PAYMENT_METHODS.bancolombia) {
      const value: BancolombiaPaymentValue = {
        accountType: input.data.accountType.trim(),
        accountNumber: input.data.accountNumber.trim(),
        holderName: input.data.holderName.trim(),
        note: input.data.note?.trim() || undefined,
      };

      await upsertSiteSetting(getManagedPaymentSettingKey(input.method), value);
      return { ok: true, method: input.method, config: value };
    }

    const value: NequiPaymentValue = {
      phoneNumber: input.data.phoneNumber.trim(),
      holderName: input.data.holderName.trim(),
      note: input.data.note?.trim() || undefined,
    };

    await upsertSiteSetting(getManagedPaymentSettingKey(input.method), value);
    return { ok: true, method: input.method, config: value };
  },
});

export { managedPaymentMethodSchema };
