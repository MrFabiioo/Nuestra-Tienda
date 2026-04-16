import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { requireAuth } from '../../firebase/guards';
import { getOrderById, listAdminOrders } from '../../services/orders/repository';

export const getOrders = defineAction({
  accept: 'json',
  input: z.object({
    status: z.string().optional(),
    orderId: z.string().optional(),
  }).optional(),
  handler: async (input, context) => {
    requireAuth(context);

    if (input?.orderId) {
      const detail = await getOrderById(input.orderId);
      if (!detail) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'No encontramos ese pedido en el backoffice.',
        });
      }

      return detail;
    }

    return {
      orders: await listAdminOrders(input?.status),
    };
  },
});
