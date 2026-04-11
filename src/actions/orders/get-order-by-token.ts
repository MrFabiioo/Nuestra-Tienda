import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getPublicOrderByToken } from '../../services/orders/repository';

export const getOrderByToken = defineAction({
  accept: 'json',
  input: z.object({
    token: z.string().min(10, 'Token inválido.'),
  }),
  handler: async ({ token }) => {
    const order = await getPublicOrderByToken(token);
    if (!order) {
      throw new ActionError({
        code: 'NOT_FOUND',
        message: 'No encontramos un pedido asociado a ese enlace público.',
      });
    }

    return order;
  },
});
