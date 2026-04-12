import { ActionError, defineAction } from 'astro:actions';
import { db, Order, Payment, PaymentProof, sql } from 'astro:db';
import { randomUUID } from 'node:crypto';
import { z } from 'astro:schema';
import { ImageUpload } from '@utils/image-upload';
import { dispatchOrderNotifications } from '../../services/notifications/dispatcher';
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_PROOF_MAX_BYTES, PAYMENT_PROOF_MIME_TYPES, PAYMENT_STATUS } from '../../services/orders/constants';
import { clearPendingOrderPointerForToken } from '../../services/orders/pending-order';
import { getPublicOrderByToken } from '../../services/orders/repository';

const paymentProofFile = z.instanceof(File)
  .refine((file) => file.size > 0, 'Adjuntá un comprobante antes de enviar.')
  .refine((file) => file.size <= PAYMENT_PROOF_MAX_BYTES, 'El comprobante no puede pesar más de 8MB.')
  .refine((file) => PAYMENT_PROOF_MIME_TYPES.includes(file.type as typeof PAYMENT_PROOF_MIME_TYPES[number]), 'Solo aceptamos imágenes JPG/PNG/WEBP o PDF.');

export const uploadPaymentProof = defineAction({
  accept: 'form',
  input: z.object({
    token: z.string().min(10, 'Referencia inválida.'),
    paymentMethod: z.enum([PAYMENT_METHODS.bancolombia, PAYMENT_METHODS.nequi, PAYMENT_METHODS.transferencia]).default(PAYMENT_METHODS.transferencia),
    proofFile: paymentProofFile,
  }),
  handler: async ({ token, paymentMethod, proofFile }, context) => {
    const publicOrder = await getPublicOrderByToken(token);
    if (!publicOrder) {
      throw new ActionError({
        code: 'NOT_FOUND',
        message: 'No encontramos el pedido para cargar ese comprobante.',
      });
    }

    if (publicOrder.status !== ORDER_STATUS.pendingPayment && publicOrder.status !== ORDER_STATUS.rejected) {
      throw new ActionError({
        code: 'CONFLICT',
        message: 'Este pedido ya no acepta nuevos comprobantes desde el link público.',
      });
    }

    const uploaded = await ImageUpload.uploadDetailed(proofFile, {
      folder: 'guacamole-shop/payment-proofs',
      publicIdPrefix: `payment-proof-${publicOrder.id}`,
      resourceType: proofFile.type === 'application/pdf' ? 'raw' : 'image',
      useDataUrlFallback: true,
    });

    const now = new Date();

    await db.run(sql`
      insert into ${PaymentProof} (
        id, paymentId, assetUrl, assetPublicId, originalFilename, mimeType, sizeBytes, uploadedAt
      ) values (
        ${randomUUID()}, ${publicOrder.payment.id}, ${uploaded.secureUrl}, ${uploaded.publicId}, ${uploaded.originalFilename}, ${uploaded.mimeType}, ${uploaded.bytes}, ${now}
      )
    `);

    await db.run(sql`
      update ${Payment}
      set method = ${paymentMethod}, status = ${PAYMENT_STATUS.underReview}, submittedAt = ${now}, rejectionReason = ${null}, updatedAt = ${now}
      where id = ${publicOrder.payment.id}
    `);

    await db.run(sql`
      update ${Order}
      set status = ${ORDER_STATUS.underReview}, updatedAt = ${now}
      where id = ${publicOrder.id}
    `);

    const updatedOrder = await getPublicOrderByToken(token);
    if (updatedOrder) {
      await dispatchOrderNotifications('payment_proof_uploaded', updatedOrder);
    }

    clearPendingOrderPointerForToken(context.cookies, token);

    return {
      ok: true,
      status: ORDER_STATUS.underReview,
      uploadedAt: now.toISOString(),
    };
  },
});
