import type { ActionAPIContext } from 'astro:actions';
import { ActionError } from 'astro:actions';
import { desc, eq, inArray, NotificationLog, Order, OrderItem, Payment, PaymentProof, Product, ProductImage, sql } from 'astro:db';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { databaseAdapter } from '../data/database-adapter';
import type { DatabaseSession } from '../data/transaction-runner';
import { serializeDbDate } from '@utils/db-date';
import { resolveProductImageUrl } from '@utils/product-images';
import { mapAdminOrderSummary, type AdminOrderSummary } from './admin-order-summary.mapper';
import { parseCartCookie } from './cart-cookie';
import { orderRequiresClientAction, ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS, roundMoney } from './constants';
import { buildPaymentProofCleanupTarget, type PaymentProofCleanupTarget } from './payment-proof-compensation';

export type CartOrderLine = {
  productId: string;
  title: string;
  slug: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string;
};

export type PublicOrder = {
  id: string;
  token: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  address: string;
  city: string;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  createdAt: Date;
  payment: {
    id: string;
    method: string;
    amount: number;
    status: string;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    reviewerUid: string | null;
    rejectionReason: string | null;
  };
  items: CartOrderLine[];
  latestProof: {
    id: string;
    assetUrl: string;
    assetPublicId: string | null;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: Date;
  } | null;
};

export function generatePublicToken() {
  return randomBytes(24).toString('hex');
}

export function hashPublicToken(token: string) {
  const secret = import.meta.env.ORDER_PUBLIC_TOKEN_SECRET || '';
  return createHash('sha256').update(`${secret}:${token}`).digest('hex');
}

export async function getCartOrderLinesFromContext(context: ActionAPIContext) {
  const cart = parseCartCookie(context.cookies.get('cart')?.value);
  if (cart.length === 0) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'Tu carrito está vacío. Agrega productos antes de avanzar al pago.',
    });
  }

  const productIds = [...new Set(cart.map((item) => item.productId))];
  const products = await getProductsByIds(databaseAdapter, productIds);
  const images = await getProductImagesByProductIds(databaseAdapter, productIds);

  return cart.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);

    if (!product) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message: `El producto ${item.productId} ya no está disponible. Revisa el carrito antes de continuar.`,
      });
    }

    const productImage = images.find((image) => image.productId === item.productId)?.image ?? null;
    const image = resolveProductImageUrl(productImage, {
      baseUrl: import.meta.env.PUBLIC_URL,
    });
    const unitPrice = Number(product.price);

    return {
      productId: item.productId,
      title: product.title,
      slug: product.slug,
      size: item.size,
      quantity: item.quantity,
      unitPrice,
      lineTotal: roundMoney(unitPrice * item.quantity),
      image,
    } satisfies CartOrderLine;
  });
}

export function buildOrderTotals(items: CartOrderLine[]) {
  const subtotal = roundMoney(items.reduce((acc, item) => acc + item.lineTotal, 0));
  const tax = 0;
  const total = subtotal;

  return { subtotal, tax, total };
}

function mapPublicOrder(orderRow: typeof Order.$inferSelect, paymentRow: typeof Payment.$inferSelect, items: typeof OrderItem.$inferSelect[], latestProof: typeof PaymentProof.$inferSelect | null, token = ''): PublicOrder {
  return {
    id: orderRow.id,
    token,
    customerName: orderRow.customerName,
    customerEmail: orderRow.customerEmail,
    customerPhone: orderRow.customerPhone,
    deliveryMethod: orderRow.deliveryMethod,
    address: orderRow.address,
    city: orderRow.city,
    notes: orderRow.notes ?? null,
    subtotal: Number(orderRow.subtotal),
    tax: Number(orderRow.tax),
    total: Number(orderRow.total),
    status: orderRow.status,
    createdAt: orderRow.createdAt,
    payment: {
      id: paymentRow.id,
      method: paymentRow.method,
      amount: Number(paymentRow.amount),
      status: paymentRow.status,
      submittedAt: paymentRow.submittedAt ?? null,
      reviewedAt: paymentRow.reviewedAt ?? null,
      reviewerUid: paymentRow.reviewerUid ?? null,
      rejectionReason: paymentRow.rejectionReason ?? null,
    },
    items: items.map((item) => ({
      productId: item.productId,
      title: item.title,
      slug: item.slug,
      size: item.size,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      image: resolveProductImageUrl(item.image ?? null, {
        baseUrl: import.meta.env.PUBLIC_URL,
      }),
    })),
    latestProof: latestProof
      ? {
          id: latestProof.id,
          assetUrl: latestProof.assetUrl,
          assetPublicId: latestProof.assetPublicId ?? null,
          originalFilename: latestProof.originalFilename,
          mimeType: latestProof.mimeType,
          sizeBytes: Number(latestProof.sizeBytes),
          uploadedAt: latestProof.uploadedAt,
        }
      : null,
  };
}

async function getProductsByIds(adapter: DatabaseSession, productIds: string[]) {
  return adapter.select().from(Product).where(inArray(Product.id, productIds));
}

async function getProductImagesByProductIds(adapter: DatabaseSession, productIds: string[]) {
  return adapter.select().from(ProductImage).where(inArray(ProductImage.productId, productIds));
}

async function getOrderRowById(adapter: DatabaseSession, orderId: string) {
  const [orderRow] = await adapter.select().from(Order).where(eq(Order.id, orderId)).limit(1);
  return orderRow ?? null;
}

async function getOrderRowByTokenHash(adapter: DatabaseSession, tokenHash: string) {
  const [orderRow] = await adapter.select().from(Order).where(eq(Order.publicTokenHash, tokenHash)).limit(1);
  return orderRow ?? null;
}

async function getPaymentByOrderId(adapter: DatabaseSession, orderId: string) {
  const [paymentRow] = await adapter.select().from(Payment).where(eq(Payment.orderId, orderId)).limit(1);
  return paymentRow ?? null;
}

async function getOrderItemsByOrderId(adapter: DatabaseSession, orderId: string) {
  return adapter.select().from(OrderItem).where(eq(OrderItem.orderId, orderId));
}

async function getLatestProofByPaymentId(adapter: DatabaseSession, paymentId: string) {
  const proofs = await adapter.select().from(PaymentProof).where(eq(PaymentProof.paymentId, paymentId)).orderBy(desc(PaymentProof.uploadedAt)).limit(1);
  return proofs[0] ?? null;
}

async function getProofsByPaymentId(adapter: DatabaseSession, paymentId: string) {
  return adapter.select().from(PaymentProof).where(eq(PaymentProof.paymentId, paymentId));
}

async function listAdminOrderRows(adapter: DatabaseSession, status?: string) {
  const whereClause = status ? sql`where o.status = ${status}` : sql``;

  return adapter.run(sql`
    select
      o.id,
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.total,
      o.status,
      o.createdAt,
      p.status as paymentStatus,
      p.method as paymentMethod,
      (
        select uploadedAt from ${PaymentProof}
        where paymentId = p.id
        order by uploadedAt desc
        limit 1
      ) as proofUploadedAt
    from ${Order} o
    inner join ${Payment} p on p.orderId = o.id
    ${whereClause}
    order by o.createdAt desc;
  `);
}

async function insertOrderRecord(adapter: DatabaseSession, input: {
  orderId: string;
  publicTokenHash: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  address: string;
  city: string;
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
  nowSql: string;
}) {
  await adapter.run(sql`
    insert into ${Order} (
      id, publicTokenHash, customerName, customerEmail, customerPhone, deliveryMethod, address, city, notes, subtotal, tax, total, status, createdAt, updatedAt
    ) values (
      ${input.orderId}, ${input.publicTokenHash}, ${input.customerName}, ${input.customerEmail}, ${input.customerPhone}, ${input.deliveryMethod}, ${input.address}, ${input.city}, ${input.notes?.trim() || null}, ${input.subtotal}, ${input.tax}, ${input.total}, ${ORDER_STATUS.pendingPayment}, ${input.nowSql}, ${input.nowSql}
    )
  `);
}

async function insertOrderItemRecord(adapter: DatabaseSession, orderId: string, item: CartOrderLine) {
  await adapter.run(sql`
    insert into ${OrderItem} (
      id, orderId, productId, title, slug, size, quantity, unitPrice, lineTotal, image
    ) values (
      ${randomUUID()}, ${orderId}, ${item.productId}, ${item.title}, ${item.slug}, ${item.size}, ${item.quantity}, ${item.unitPrice}, ${item.lineTotal}, ${item.image}
    )
  `);
}

async function insertPaymentRecord(adapter: DatabaseSession, input: {
  paymentId: string;
  orderId: string;
  amount: number;
  nowSql: string;
}) {
  await adapter.run(sql`
    insert into ${Payment} (
      id, orderId, method, amount, status, createdAt, updatedAt
    ) values (
      ${input.paymentId}, ${input.orderId}, ${PAYMENT_METHODS.bancolombia}, ${input.amount}, ${PAYMENT_STATUS.pending}, ${input.nowSql}, ${input.nowSql}
    )
  `);
}

async function insertPaymentProofRecord(adapter: DatabaseSession, input: {
  proofId: string;
  paymentId: string;
  assetUrl: string;
  assetPublicId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAtSql: string;
}) {
  await adapter.run(sql`
    insert into ${PaymentProof} (
      id, paymentId, assetUrl, assetPublicId, originalFilename, mimeType, sizeBytes, uploadedAt
    ) values (
      ${input.proofId}, ${input.paymentId}, ${input.assetUrl}, ${input.assetPublicId}, ${input.originalFilename}, ${input.mimeType}, ${input.sizeBytes}, ${input.uploadedAtSql}
    )
  `);
}

async function updatePaymentForProofSubmission(adapter: DatabaseSession, input: {
  paymentId: string;
  paymentMethod: string;
  nowSql: string;
}) {
  await adapter.run(sql`
    update ${Payment}
    set method = ${input.paymentMethod}, status = ${PAYMENT_STATUS.underReview}, submittedAt = ${input.nowSql}, rejectionReason = ${null}, updatedAt = ${input.nowSql}
    where id = ${input.paymentId}
  `);
}

async function updateOrderStatus(adapter: DatabaseSession, input: {
  orderId: string;
  status: string;
  nowSql: string;
}) {
  await adapter.run(sql`
    update ${Order}
    set status = ${input.status}, updatedAt = ${input.nowSql}
    where id = ${input.orderId}
  `);
}

async function updateOrderPublicTokenHash(adapter: DatabaseSession, input: {
  orderId: string;
  publicTokenHash: string;
  nowSql: string;
}) {
  await adapter.run(sql`
    update ${Order}
    set publicTokenHash = ${input.publicTokenHash}, updatedAt = ${input.nowSql}
    where id = ${input.orderId}
  `);
}

async function reviewPaymentRecord(adapter: DatabaseSession, input: {
  paymentId: string;
  status: string;
  reviewerUid: string;
  rejectionReason: string | null;
  nowSql: string;
}) {
  await adapter.run(sql`
    update ${Payment}
    set
      status = ${input.status},
      reviewedAt = ${input.nowSql},
      reviewerUid = ${input.reviewerUid},
      rejectionReason = ${input.rejectionReason},
      updatedAt = ${input.nowSql}
    where id = ${input.paymentId}
  `);
}

async function deletePaymentProofRecords(adapter: DatabaseSession, paymentId: string) {
  await adapter.run(sql`delete from ${PaymentProof} where paymentId = ${paymentId}`);
}

async function deleteNotificationLogs(adapter: DatabaseSession, orderId: string) {
  await adapter.run(sql`delete from ${NotificationLog} where orderId = ${orderId}`);
}

async function deletePaymentRecord(adapter: DatabaseSession, orderId: string) {
  await adapter.run(sql`delete from ${Payment} where orderId = ${orderId}`);
}

async function deleteOrderItems(adapter: DatabaseSession, orderId: string) {
  await adapter.run(sql`delete from ${OrderItem} where orderId = ${orderId}`);
}

async function deleteOrderRecord(adapter: DatabaseSession, orderId: string) {
  await adapter.run(sql`delete from ${Order} where id = ${orderId}`);
}

export async function getOrderSnapshotById(orderId: string): Promise<PublicOrder | null> {
  const orderRow = await getOrderRowById(databaseAdapter, orderId);
  if (!orderRow) return null;

  const paymentRow = await getPaymentByOrderId(databaseAdapter, orderRow.id);
  if (!paymentRow) return null;

  const items = await getOrderItemsByOrderId(databaseAdapter, orderRow.id);
  const latestProof = await getLatestProofByPaymentId(databaseAdapter, paymentRow.id);

  return mapPublicOrder(orderRow, paymentRow, items, latestProof);
}

export async function getPublicOrderByToken(token: string): Promise<PublicOrder | null> {
  const tokenHash = hashPublicToken(token);
  const orderRow = await getOrderRowByTokenHash(databaseAdapter, tokenHash);
  if (!orderRow) return null;

  const snapshot = await getOrderSnapshotById(orderRow.id);
  return snapshot ? { ...snapshot, token } : null;
}

export async function getOrderById(orderId: string) {
  const orderRow = await getOrderRowById(databaseAdapter, orderId);
  if (!orderRow) return null;

  const paymentRow = await getPaymentByOrderId(databaseAdapter, orderRow.id);
  if (!paymentRow) return null;

  const items = await getOrderItemsByOrderId(databaseAdapter, orderRow.id);
  const latestProof = await getLatestProofByPaymentId(databaseAdapter, paymentRow.id);

  return {
    order: orderRow,
    payment: paymentRow,
    items,
    latestProof,
  };
}

export async function listAdminOrders(status?: string): Promise<AdminOrderSummary[]> {
  const result = await listAdminOrderRows(databaseAdapter, status);

  return result.rows.map((row) => mapAdminOrderSummary(row as Record<string, unknown>));
}

export async function createPersistentOrder(input: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  address: string;
  city: string;
  notes?: string;
  items: CartOrderLine[];
}) {
  const now = new Date();
  const nowSql = serializeDbDate(now);
  const orderId = randomUUID();
  const paymentId = randomUUID();
  const publicToken = generatePublicToken();
  const publicTokenHash = hashPublicToken(publicToken);
  const totals = buildOrderTotals(input.items);

  await databaseAdapter.transaction.run(async (session) => {
    await insertOrderRecord(session, {
      orderId,
      publicTokenHash,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      deliveryMethod: input.deliveryMethod,
      address: input.address,
      city: input.city,
      notes: input.notes,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      nowSql,
    });

    for (const item of input.items) {
      await insertOrderItemRecord(session, orderId, item);
    }

    await insertPaymentRecord(session, {
      paymentId,
      orderId,
      amount: totals.total,
      nowSql,
    });
  });

  return {
    orderId,
    paymentId,
    publicToken,
    ...totals,
  };
}

export function clearCartCookie(context: ActionAPIContext) {
  context.cookies.delete('cart', { path: '/' });
}

export async function submitPaymentProof(input: {
  orderId: string;
  paymentId: string;
  paymentMethod: string;
  assetUrl: string;
  assetPublicId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const uploadedAt = new Date();
  const uploadedAtSql = serializeDbDate(uploadedAt);

  await databaseAdapter.transaction.run(async (session) => {
    await insertPaymentProofRecord(session, {
      proofId: randomUUID(),
      paymentId: input.paymentId,
      assetUrl: input.assetUrl,
      assetPublicId: input.assetPublicId,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedAtSql,
    });

    await updatePaymentForProofSubmission(session, {
      paymentId: input.paymentId,
      paymentMethod: input.paymentMethod,
      nowSql: uploadedAtSql,
    });

    await updateOrderStatus(session, {
      orderId: input.orderId,
      status: ORDER_STATUS.underReview,
      nowSql: uploadedAtSql,
    });
  });

  return {
    status: ORDER_STATUS.underReview,
    uploadedAt,
  };
}

export async function reviewOrderPayment(input: {
  orderId: string;
  paymentId: string;
  decision: 'approved' | 'rejected';
  reviewerUid: string;
  rejectionReason?: string;
}) {
  const reviewedAt = new Date();
  const reviewedAtSql = serializeDbDate(reviewedAt);
  const orderStatus = input.decision === 'approved' ? ORDER_STATUS.approved : ORDER_STATUS.rejected;
  const paymentStatus = input.decision === 'approved' ? PAYMENT_STATUS.approved : PAYMENT_STATUS.rejected;

  await databaseAdapter.transaction.run(async (session) => {
    await updateOrderStatus(session, {
      orderId: input.orderId,
      status: orderStatus,
      nowSql: reviewedAtSql,
    });

    await reviewPaymentRecord(session, {
      paymentId: input.paymentId,
      status: paymentStatus,
      reviewerUid: input.reviewerUid,
      rejectionReason: input.decision === 'rejected' ? input.rejectionReason?.trim() ?? null : null,
      nowSql: reviewedAtSql,
    });
  });

  return {
    status: orderStatus,
    reviewedAt,
  };
}

export async function regenerateOrderPaymentLink(orderId: string) {
  const now = new Date();
  const nowSql = serializeDbDate(now);
  const publicToken = generatePublicToken();
  const publicTokenHash = hashPublicToken(publicToken);

  await databaseAdapter.transaction.run(async (session) => {
    const orderRow = await getOrderRowById(session, orderId);

    if (!orderRow) {
      throw new ActionError({
        code: 'NOT_FOUND',
        message: 'No encontramos el pedido para regenerar el link.',
      });
    }

    if (!orderRequiresClientAction(orderRow.status)) {
      throw new ActionError({
        code: 'CONFLICT',
        message: 'Este pedido ya no admite regenerar un link público de pago.',
      });
    }

    await updateOrderPublicTokenHash(session, {
      orderId,
      publicTokenHash,
      nowSql,
    });
  });

  return {
    publicToken,
    regeneratedAt: now,
  };
}

export async function deleteOrderRecords(orderId: string) {
  return databaseAdapter.transaction.run(async (session) => {
    const orderRow = await getOrderRowById(session, orderId);
    if (!orderRow) {
      throw new ActionError({
        code: 'NOT_FOUND',
        message: 'No se encontró el pedido a eliminar.',
      });
    }

    const paymentRow = await getPaymentByOrderId(session, orderId);
    const proofs = paymentRow ? await getProofsByPaymentId(session, paymentRow.id) : [];
    const cleanupTargets = proofs
      .map((proof) => buildPaymentProofCleanupTarget(proof.assetPublicId, proof.mimeType))
      .filter((proof): proof is PaymentProofCleanupTarget => proof !== null);

    if (paymentRow) {
      await deletePaymentProofRecords(session, paymentRow.id);
    }

    await deleteNotificationLogs(session, orderId);

    if (paymentRow) {
      await deletePaymentRecord(session, orderId);
    }

    await deleteOrderItems(session, orderId);
    await deleteOrderRecord(session, orderId);

    return {
      cleanupTargets,
    };
  });
}
