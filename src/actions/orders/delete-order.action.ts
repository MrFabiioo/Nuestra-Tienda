import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { requireSensitiveAdminAccess } from '../../firebase/guards';
import { ImageUpload } from '@utils/image-upload';
import { deleteOrderRecords } from '../../services/orders/repository';

export const deleteOrder = defineAction({
  accept: 'json',
  input: z.object({
    id: z.string().min(1, 'ID de pedido inválido.'),
  }),
  handler: async ({ id }, context) => {
    requireSensitiveAdminAccess(context, 'eliminar pedidos');

    const { cleanupTargets } = await deleteOrderRecords(id);

    if (cleanupTargets.length > 0) {
      const results = await Promise.all(
        cleanupTargets.map((target) => ImageUpload.deleteAsset(target.publicId, target.resourceType)),
      );

      const failedAssets = cleanupTargets.filter((_, index) => !results[index]);
      if (failedAssets.length > 0) {
        console.error('[deleteOrder] Algunos assets remotos no se pudieron limpiar después del commit.', {
          orderId: id,
          assets: failedAssets,
        });
      }
    }

    return { ok: true };
  },
});
