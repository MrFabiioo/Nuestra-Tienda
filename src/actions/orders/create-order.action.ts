import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { clearCartCookie, createPersistentOrder, getCartOrderLinesFromContext } from '../../services/orders/repository';
import { setPendingOrderPointer } from '../../services/orders/pending-order';

export const createOrder = defineAction({
  accept: 'form',
  input: z.object({
    fullName: z.string().min(3, 'Decinos tu nombre completo.'),
    phone: z.string().min(7, 'Necesitamos un teléfono válido.'),
    email: z.string().email('Ingresá un correo válido.'),
    deliveryMethod: z.string().min(1, 'Seleccioná una modalidad de entrega.'),
    address: z.string().min(3, 'La dirección es obligatoria.'),
    city: z.string().min(2, 'La ciudad es obligatoria.'),
    notes: z.string().optional(),
  }),
  handler: async (input, context) => {
    const items = await getCartOrderLinesFromContext(context);
    const order = await createPersistentOrder({
      customerName: input.fullName.trim(),
      customerEmail: input.email.trim().toLowerCase(),
      customerPhone: input.phone.trim(),
      deliveryMethod: input.deliveryMethod.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      notes: input.notes,
      items,
    });

    clearCartCookie(context);
    setPendingOrderPointer(context.cookies, order.publicToken);

    return {
      ok: true,
      orderId: order.orderId,
      publicToken: order.publicToken,
      redirectUrl: `/pagos/${order.publicToken}`,
    };
  },
});
