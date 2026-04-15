import type { ActionAPIContext } from 'astro:actions';
import { ActionError } from 'astro:actions';
import { db, desc, eq, inArray, Order, OrderItem, Payment, PaymentProof, Product, ProductImage, sql } from 'astro:db';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { CartItem } from '@interfaces/cart-item';
import { ORDER_STATUS, ORDER_TAX_RATE, PAYMENT_METHODS, PAYMENT_STATUS, roundMoney } from './constants';

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

export type AdminOrderSummary = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: Date;
  paymentStatus: string;
  paymentMethod: string;
  proofUploadedAt: Date | null;
};

export function generatePublicToken() {
  return randomBytes(24).toString('hex');
}

export function hashPublicToken(token: string) {
  const secret = import.meta.env.ORDER_PUBLIC_TOKEN_SECRET || '';
  return createHash('sha256').update(`${secret}:${token}`).digest('hex');
}

function parseCartCookie(raw: string | undefined): CartItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getCartOrderLinesFromContext(context: ActionAPIContext) {
  const cart = parseCartCookie(context.cookies.get('cart')?.value);
  if (cart.length === 0) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'Tu carrito está vacío. Sumá productos antes de avanzar al pago.',
    });
  }

  const productIds = [...new Set(cart.map((item) => item.productId))];
  const products = await db.select().from(Product).where(inArray(Product.id, productIds));
  const images = await db.select().from(ProductImage).where(inArray(ProductImage.productId, productIds));

  return cart.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);

    if (!product) {
      throw new ActionError({
        code: 'BAD_REQUEST',
        message: `El producto ${item.productId} ya no está disponible. Revisá el carrito antes de seguir.`,
      });
    }

    const productImage = images.find((image) => image.productId === item.productId)?.image ?? 'no-image.png';
    const image = productImage.startsWith('http') || productImage.startsWith('data:')
      ? productImage
      : `${import.meta.env.PUBLIC_URL}/images/products/${productImage}`;
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
  const tax = roundMoney(subtotal * ORDER_TAX_RATE);
  const total = roundMoney(subtotal + tax);

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
      image: item.image ?? 'no-image.png',
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

export async function getOrderSnapshotById(orderId: string): Promise<PublicOrder | null> {
  const [orderRow] = await db.select().from(Order).where(eq(Order.id, orderId)).limit(1);
  if (!orderRow) return null;

  const [paymentRow] = await db.select().from(Payment).where(eq(Payment.orderId, orderRow.id)).limit(1);
  if (!paymentRow) return null;

  const items = await db.select().from(OrderItem).where(eq(OrderItem.orderId, orderRow.id));
  const proofs = await db.select().from(PaymentProof).where(eq(PaymentProof.paymentId, paymentRow.id)).orderBy(desc(PaymentProof.uploadedAt)).limit(1);

  return mapPublicOrder(orderRow, paymentRow, items, proofs[0] ?? null);
}

export async function getPublicOrderByToken(token: string): Promise<PublicOrder | null> {
  const tokenHash = hashPublicToken(token);
  const [orderRow] = await db.select().from(Order).where(eq(Order.publicTokenHash, tokenHash)).limit(1);
  if (!orderRow) return null;

  const snapshot = await getOrderSnapshotById(orderRow.id);
  return snapshot ? { ...snapshot, token } : null;
}

export async function getOrderById(orderId: string) {
  const [orderRow] = await db.select().from(Order).where(eq(Order.id, orderId)).limit(1);
  if (!orderRow) return null;

  const [paymentRow] = await db.select().from(Payment).where(eq(Payment.orderId, orderRow.id)).limit(1);
  if (!paymentRow) return null;

  const items = await db.select().from(OrderItem).where(eq(OrderItem.orderId, orderRow.id));
  const proofs = await db.select().from(PaymentProof).where(eq(PaymentProof.paymentId, paymentRow.id)).orderBy(desc(PaymentProof.uploadedAt)).limit(1);

  return {
    order: orderRow,
    payment: paymentRow,
    items,
    latestProof: proofs[0] ?? null,
  };
}

export async function listAdminOrders(status?: string): Promise<AdminOrderSummary[]> {
  const whereClause = status ? sql`where o.status = ${status}` : sql``;
  const result = await db.run(sql`
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

  return result.rows as unknown as AdminOrderSummary[];
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
  const orderId = randomUUID();
  const paymentId = randomUUID();
  const publicToken = generatePublicToken();
  const publicTokenHash = hashPublicToken(publicToken);
  const totals = buildOrderTotals(input.items);

  await db.run(sql`
    insert into ${Order} (
      id, publicTokenHash, customerName, customerEmail, customerPhone, deliveryMethod, address, city, notes, subtotal, tax, total, status, createdAt, updatedAt
    ) values (
      ${orderId}, ${publicTokenHash}, ${input.customerName}, ${input.customerEmail}, ${input.customerPhone}, ${input.deliveryMethod}, ${input.address}, ${input.city}, ${input.notes?.trim() || null}, ${totals.subtotal}, ${totals.tax}, ${totals.total}, ${ORDER_STATUS.pendingPayment}, ${now}, ${now}
    )
  `);

  for (const item of input.items) {
    await db.run(sql`
      insert into ${OrderItem} (
        id, orderId, productId, title, slug, size, quantity, unitPrice, lineTotal, image
      ) values (
        ${randomUUID()}, ${orderId}, ${item.productId}, ${item.title}, ${item.slug}, ${item.size}, ${item.quantity}, ${item.unitPrice}, ${item.lineTotal}, ${item.image}
      )
    `);
  }

  await db.run(sql`
    insert into ${Payment} (
      id, orderId, method, amount, status, createdAt, updatedAt
    ) values (
      ${paymentId}, ${orderId}, ${PAYMENT_METHODS.bancolombia}, ${totals.total}, ${PAYMENT_STATUS.pending}, ${now}, ${now}
    )
  `);

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
