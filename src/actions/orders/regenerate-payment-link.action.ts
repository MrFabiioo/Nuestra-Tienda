import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { requireSensitiveAdminAccess } from '../../firebase/guards';
import { orderRequiresClientAction } from '../../services/orders/constants';
import { getOrderById, regenerateOrderPaymentLink } from '../../services/orders/repository';

export const regeneratePaymentLink = defineAction({
  accept: 'json',
  input: z.object({
    orderId: z.string().min(1, 'Pedido inválido.'),
  }),
  handler: async ({ orderId }, context) => {
    requireSensitiveAdminAccess(context, 'regenerar links de pago');

    const detail = await getOrderById(orderId);

    if (!detail) {
      throw new ActionError({
        code: 'NOT_FOUND',
        message: 'No encontramos ese pedido en el backoffice.',
      });
    }

    if (!orderRequiresClientAction(detail.order.status)) {
      throw new ActionError({
        code: 'CONFLICT',
        message: 'Solo puedes regenerar links para pedidos que todavía requieren acción del cliente.',
      });
    }

    const result = await regenerateOrderPaymentLink(orderId);

    return {
      ok: true,
      publicToken: result.publicToken,
      redirectUrl: `/pagos/${result.publicToken}`,
      regeneratedAt: result.regeneratedAt.toISOString(),
    };
  },
});
