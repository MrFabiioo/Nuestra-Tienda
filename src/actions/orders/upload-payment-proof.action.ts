import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { ImageUpload } from '@utils/image-upload';
import { dispatchOrderNotifications } from '../../services/notifications/dispatcher';
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_PROOF_MAX_BYTES, PAYMENT_PROOF_MIME_TYPES } from '../../services/orders/constants';
import { clearPendingOrderPointerForToken } from '../../services/orders/pending-order';
import { getPaymentProofCleanupResourceType } from '../../services/orders/payment-proof-compensation';
import { getPublicOrderByToken, submitPaymentProof } from '../../services/orders/repository';

const paymentProofFile = z.instanceof(File)
  .refine((file) => file.size > 0, 'Adjuntá un comprobante antes de enviar.')
  .refine((file) => file.size <= PAYMENT_PROOF_MAX_BYTES, 'El comprobante no puede pesar más de 8MB.')
  .refine((file) => PAYMENT_PROOF_MIME_TYPES.includes(file.type as typeof PAYMENT_PROOF_MIME_TYPES[number]), 'Solo aceptamos imágenes JPG/PNG/WEBP o PDF.');

export const uploadPaymentProof = defineAction({
  accept: 'form',
  input: z.object({
    token: z.string().min(10, 'Referencia inválida.'),
    paymentMethod: z.enum([PAYMENT_METHODS.bancolombia, PAYMENT_METHODS.nequi, PAYMENT_METHODS.qr]).default(PAYMENT_METHODS.bancolombia),
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
      resourceType: getPaymentProofCleanupResourceType(proofFile.type),
      useDataUrlFallback: true,
    });

    let result: Awaited<ReturnType<typeof submitPaymentProof>>;

    try {
      result = await submitPaymentProof({
        orderId: publicOrder.id,
        paymentId: publicOrder.payment.id,
        paymentMethod,
        assetUrl: uploaded.secureUrl,
        assetPublicId: uploaded.publicId,
        originalFilename: uploaded.originalFilename,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.bytes,
      });
    } catch (error) {
      const cleanupOk = await ImageUpload.deleteAsset(
        uploaded.publicId,
        getPaymentProofCleanupResourceType(proofFile.type),
      );

      if (!cleanupOk) {
        console.error('[uploadPaymentProof] No se pudo compensar el asset subido tras rollback.', {
          orderId: publicOrder.id,
          paymentId: publicOrder.payment.id,
          publicId: uploaded.publicId,
        });
      }

      throw error;
    }

    const updatedOrder = await getPublicOrderByToken(token);
    if (updatedOrder) {
      await dispatchOrderNotifications('payment_proof_uploaded', updatedOrder);
    }

    clearPendingOrderPointerForToken(context.cookies, token);

    return {
      ok: true,
      status: result.status,
      uploadedAt: result.uploadedAt.toISOString(),
    };
  },
});
