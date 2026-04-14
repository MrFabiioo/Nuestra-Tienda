import { ActionError, defineAction } from 'astro:actions';
import { db, eq, Order, OrderItem, Payment, PaymentProof, NotificationLog } from 'astro:db';
import { z } from 'astro:schema';
import { requireSensitiveAdminAccess } from '../../firebase/guards';
import { ImageUpload } from '@utils/image-upload';

export const deleteOrder = defineAction({
  accept: 'json',
  input: z.object({
    id: z.string().min(1, 'ID de pedido inválido.'),
  }),
  handler: async ({ id }, context) => {
    requireSensitiveAdminAccess(context, 'eliminar pedidos');

    const [order] = await db.select().from(Order).where(eq(Order.id, id));
    if (!order) {
      throw new ActionError({
        code: 'NOT_FOUND',
        message: 'No se encontró el pedido a eliminar.',
      });
    }

    // 1. Limpiar assets de Cloudinary si hay comprobantes
    const [payment] = await db.select().from(Payment).where(eq(Payment.orderId, id));

    if (payment) {
      const proofs = await db.select().from(PaymentProof).where(eq(PaymentProof.paymentId, payment.id));

      await Promise.all(
        proofs
          .filter((p) => p.assetPublicId && !p.assetPublicId.startsWith('inline'))
          .map((p) =>
            ImageUpload.deleteAsset(
              p.assetPublicId!,
              p.mimeType === 'application/pdf' ? 'raw' : 'image',
            ),
          ),
      );

      // 2. Eliminar comprobantes de DB
      await db.delete(PaymentProof).where(eq(PaymentProof.paymentId, payment.id));
    }

    // 3. Cascade en orden correcto por FK
    await db.delete(NotificationLog).where(eq(NotificationLog.orderId, id));
    if (payment) {
      await db.delete(Payment).where(eq(Payment.orderId, id));
    }
    await db.delete(OrderItem).where(eq(OrderItem.orderId, id));
    await db.delete(Order).where(eq(Order.id, id));

    return { ok: true };
  },
});
