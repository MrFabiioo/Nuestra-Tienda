import { ActionError, defineAction } from 'astro:actions';
import { db, Order, Payment, sql } from 'astro:db';
import { z } from 'astro:schema';
import { serializeDbDate } from '@utils/db-date';
import { requireSensitiveAdminAccess } from '../../firebase/guards';
import { dispatchOrderNotifications } from '../../services/notifications/dispatcher';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../services/orders/constants';
import { getOrderById, getOrderSnapshotById } from '../../services/orders/repository';

export const reviewPayment = defineAction({
  accept: 'form',
  input: z.object({
    orderId: z.string().min(1, 'Pedido inválido.'),
    decision: z.enum(['approved', 'rejected']),
    rejectionReason: z.string().optional(),
  }),
  handler: async ({ orderId, decision, rejectionReason }, context) => {
    const user = requireSensitiveAdminAccess(context, 'revisar pagos');
    const detail = await getOrderById(orderId);

    if (!detail) {
      throw new ActionError({
        code: 'NOT_FOUND',
        message: 'No encontramos ese pedido para revisarlo.',
      });
    }

    if (detail.order.status !== ORDER_STATUS.underReview) {
      throw new ActionError({
        code: 'CONFLICT',
        message: 'Este pedido ya no está en revisión manual.',
      });
    }

    if (decision === 'rejected' && !rejectionReason?.trim()) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message: 'Si rechazas el pago, deja un motivo claro para el cliente.',
      });
    }

    const now = new Date();
    const nowSql = serializeDbDate(now);
    const orderStatus = decision === 'approved' ? ORDER_STATUS.approved : ORDER_STATUS.rejected;
    const paymentStatus = decision === 'approved' ? PAYMENT_STATUS.approved : PAYMENT_STATUS.rejected;

    await db.run(sql`
      update ${Order}
      set status = ${orderStatus}, updatedAt = ${nowSql}
      where id = ${orderId}
    `);

    await db.run(sql`
      update ${Payment}
      set
        status = ${paymentStatus},
        reviewedAt = ${nowSql},
        reviewerUid = ${user.uid},
        rejectionReason = ${decision === 'rejected' ? rejectionReason?.trim() ?? null : null},
        updatedAt = ${nowSql}
      where id = ${detail.payment.id}
    `);

    const snapshot = await getOrderSnapshotById(orderId);
    if (snapshot) {
      await dispatchOrderNotifications(decision === 'approved' ? 'payment_approved' : 'payment_rejected', snapshot);
    }

    return {
      ok: true,
      status: orderStatus,
      reviewedAt: now.toISOString(),
    };
  },
});
