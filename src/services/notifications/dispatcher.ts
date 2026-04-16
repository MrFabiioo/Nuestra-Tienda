import { db, NotificationLog, sql } from 'astro:db';
import { serializeDbDate } from '@utils/db-date';
import { randomUUID } from 'node:crypto';
import type { PublicOrder } from '../orders/repository';
import { NOTIFICATION_CHANNEL, NOTIFICATION_STATUS } from '../orders/constants';
import { sendEmail } from './email';
import { sendWhatsApp } from './whatsapp';

type NotificationEvent = 'payment_proof_uploaded' | 'payment_approved' | 'payment_rejected';

type NotificationDraft = {
  channel: 'email' | 'whatsapp';
  template: NotificationEvent;
  recipient: string;
  subject?: string;
  html?: string;
  text: string;
  provider: string;
};

function adminRecipients() {
  return {
    email: import.meta.env.ORDER_NOTIFICATIONS_ADMIN_EMAIL as string | undefined,
    whatsapp: import.meta.env.ORDER_NOTIFICATIONS_ADMIN_WHATSAPP as string | undefined,
  };
}

// ─── Formatters ────────────────────────────────────────────────────────────────

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── WhatsApp builders ─────────────────────────────────────────────────────────

function itemsAsWaText(order: PublicOrder): string {
  return order.items
    .map((i) => `  • ${i.title} (${i.size}) × ${i.quantity} — ${formatCOP(i.lineTotal)}`)
    .join('\n');
}

function buildCustomerWhatsApp(event: NotificationEvent, order: PublicOrder, ref: string): string {
  const items = itemsAsWaText(order);
  const total = `💰 *Total: ${formatCOP(order.total)}*`;

  if (event === 'payment_proof_uploaded') {
    return [
      `✅ *Comprobante recibido · ${ref}*`,
      ``,
      `Hola *${order.customerName}*, recibimos tu comprobante.`,
      ``,
      `📦 *Tu pedido:*`,
      items,
      ``,
      total,
      ``,
      `Ya quedó en revisión. Te avisamos cuando esté aprobado.`,
    ].join('\n');
  }

  if (event === 'payment_approved') {
    return [
      `🎉 *¡Pago aprobado! · ${ref}*`,
      ``,
      `Hola *${order.customerName}*, tu pago fue aprobado.`,
      ``,
      `📦 *Tu pedido:*`,
      items,
      ``,
      total,
      ``,
      `¡Gracias por tu compra!`,
    ].join('\n');
  }

  return [
    `❌ *Comprobante rechazado · ${ref}*`,
    ``,
    `Hola *${order.customerName}*, el comprobante fue rechazado.`,
    ``,
    `📝 *Motivo:* ${order.payment.rejectionReason ?? 'sin detalle adicional'}`,
    ``,
    `Puedes subir uno nuevo desde tu enlace público.`,
  ].join('\n');
}

function buildAdminWhatsApp(event: NotificationEvent, order: PublicOrder, ref: string): string {
  const items = itemsAsWaText(order);
  const headers: Record<NotificationEvent, string> = {
    payment_proof_uploaded: '🔔 *Nuevo comprobante pendiente*',
    payment_approved: '✅ *Pago aprobado*',
    payment_rejected: '❌ *Pago rechazado*',
  };

  return [
    `${headers[event]} · ${ref}`,
    ``,
    `👤 *Cliente:* ${order.customerName}`,
    `📱 *Teléfono:* ${order.customerPhone}`,
    ``,
    `📦 *Productos:*`,
    items,
    ``,
    `💰 *Total: ${formatCOP(order.total)}*`,
    ``,
    `Revisalo en /admin/orders`,
  ].join('\n');
}

// ─── Email builders ────────────────────────────────────────────────────────────

function itemsAsEmailHtml(order: PublicOrder): string {
  return order.items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;width:72px;">
        <img src="${item.image}" alt="${item.title}" width="64" height="64"
          style="border-radius:8px;object-fit:cover;display:block;background:#f5f5f5;" />
      </td>
      <td style="padding:12px 0 12px 16px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
        <div style="font-weight:600;color:#1a1a1a;font-size:15px;">${item.title}</div>
        <div style="font-size:13px;color:#777;margin-top:3px;">Talla: ${item.size} &nbsp;·&nbsp; Cantidad: ${item.quantity}</div>
        <div style="font-size:13px;color:#999;margin-top:2px;">${formatCOP(item.unitPrice)} c/u</div>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;text-align:right;white-space:nowrap;font-weight:700;color:#1a1a1a;font-size:15px;">
        ${formatCOP(item.lineTotal)}
      </td>
    </tr>
  `).join('');
}

function customerInfoHtml(order: PublicOrder): string {
  return `
    <table style="width:100%;margin-bottom:24px;background:#f0f7f4;border-radius:8px;border-left:4px solid #2d6a4f;border-collapse:collapse;">
      <tr>
        <td style="padding:14px 16px;">
          <div style="font-size:12px;color:#5a8a72;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Cliente</div>
          <div style="font-size:15px;font-weight:700;color:#1a1a1a;">${order.customerName}</div>
          <div style="font-size:13px;color:#555;margin-top:3px;">${order.customerPhone} &nbsp;·&nbsp; ${order.customerEmail}</div>
        </td>
      </tr>
    </table>
  `;
}

function wrapEmailHtml(opts: {
  ref: string;
  title: string;
  intro: string;
  order: PublicOrder;
  showCustomerInfo?: boolean;
}): string {
  const { ref, title, intro, order, showCustomerInfo } = opts;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table style="max-width:600px;margin:0 auto;width:100%;border-collapse:collapse;">
    <tr>
      <td>
        <!-- Header -->
        <table style="width:100%;background:#2d6a4f;border-radius:12px 12px 0 0;border-collapse:collapse;">
          <tr>
            <td style="padding:28px 24px;text-align:center;">
              <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:.5px;">🥑 Nuestra Tienda</div>
              <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,.7);">${ref}</div>
            </td>
          </tr>
        </table>
        <!-- Body -->
        <table style="width:100%;background:#fff;border-collapse:collapse;">
          <tr>
            <td style="padding:28px 24px;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">${title}</h2>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">${intro}</p>
              ${showCustomerInfo ? customerInfoHtml(order) : ''}
              <table style="width:100%;border-collapse:collapse;">
                ${itemsAsEmailHtml(order)}
              </table>
              <table style="width:100%;margin-top:20px;background:#f9f9f9;border-radius:8px;border-collapse:collapse;">
                <tr>
                  <td style="padding:16px;color:#555;font-size:15px;">Total del pedido</td>
                  <td style="padding:16px;text-align:right;font-size:22px;font-weight:800;color:#2d6a4f;">${formatCOP(order.total)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!-- Footer -->
        <table style="width:100%;background:#fafafa;border-top:1px solid #f0f0f0;border-radius:0 0 12px 12px;border-collapse:collapse;">
          <tr>
            <td style="padding:16px 24px;text-align:center;font-size:12px;color:#aaa;">
              Nuestra Tienda &nbsp;·&nbsp; Este correo fue generado automáticamente
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function itemsAsPlainText(order: PublicOrder): string {
  return order.items
    .map((i) => `- ${i.title} (${i.size}) x${i.quantity}: ${formatCOP(i.lineTotal)}`)
    .join('\n');
}

// ─── Draft builder ─────────────────────────────────────────────────────────────

function buildDrafts(event: NotificationEvent, order: PublicOrder): NotificationDraft[] {
  const admin = adminRecipients();
  const ref = `Pedido ${order.id.slice(0, 8).toUpperCase()}`;
  const items = itemsAsPlainText(order);

  const titles: Record<NotificationEvent, { customer: string; admin: string }> = {
    payment_proof_uploaded: {
      customer: 'Recibimos tu comprobante',
      admin: 'Nuevo comprobante pendiente de revisión',
    },
    payment_approved: {
      customer: '¡Tu pago fue aprobado!',
      admin: 'Pago aprobado',
    },
    payment_rejected: {
      customer: 'Comprobante rechazado',
      admin: 'Pago rechazado',
    },
  };

  const intros: Record<NotificationEvent, { customer: string; admin: string }> = {
    payment_proof_uploaded: {
      customer: `Hola ${order.customerName}, recibimos tu comprobante. Ya quedó en revisión y te avisamos cuando esté aprobado.`,
      admin: `Entró un nuevo comprobante para revisar.`,
    },
    payment_approved: {
      customer: `Hola ${order.customerName}, tu pago fue aprobado. ¡Gracias por tu compra!`,
      admin: `Se aprobó el pago del ${ref}.`,
    },
    payment_rejected: {
      customer: `Hola ${order.customerName}, el comprobante fue rechazado. Motivo: ${order.payment.rejectionReason ?? 'sin detalle adicional'}. Puedes subir uno nuevo desde tu enlace público.`,
      admin: `Se rechazó el pago del ${ref}.`,
    },
  };

  const drafts: NotificationDraft[] = [
    // ── Customer email ──
    {
      channel: NOTIFICATION_CHANNEL.email,
      template: event,
      recipient: order.customerEmail,
      provider: 'resend',
      subject: `${titles[event].customer} · ${ref}`,
      text: `${intros[event].customer}\n\nTu pedido:\n${items}\n\nTotal: ${formatCOP(order.total)}`,
      html: wrapEmailHtml({
        ref,
        title: titles[event].customer,
        intro: intros[event].customer,
        order,
        showCustomerInfo: false,
      }),
    },
    // ── Customer WhatsApp ──
    {
      channel: NOTIFICATION_CHANNEL.whatsapp,
      template: event,
      recipient: order.customerPhone,
      provider: 'whatsapp-cloud',
      text: buildCustomerWhatsApp(event, order, ref),
    },
    // ── Admin email ──
    ...(admin.email ? [{
      channel: NOTIFICATION_CHANNEL.email,
      template: event,
      recipient: admin.email,
      provider: 'resend',
      subject: `${titles[event].admin} · ${ref}`,
      text: `${intros[event].admin}\n\nCliente: ${order.customerName}\nTeléfono: ${order.customerPhone}\n\nProductos:\n${items}\n\nTotal: ${formatCOP(order.total)}`,
      html: wrapEmailHtml({
        ref,
        title: titles[event].admin,
        intro: intros[event].admin,
        order,
        showCustomerInfo: true,
      }),
    }] as NotificationDraft[] : []),
    // ── Admin WhatsApp ──
    ...(admin.whatsapp ? [{
      channel: NOTIFICATION_CHANNEL.whatsapp,
      template: event,
      recipient: admin.whatsapp,
      provider: 'whatsapp-cloud',
      text: buildAdminWhatsApp(event, order, ref),
    }] as NotificationDraft[] : []),
  ];

  return drafts;
}

// ─── Log helpers ───────────────────────────────────────────────────────────────

async function createLog(orderId: string, draft: NotificationDraft) {
  const id = randomUUID();
  const now = new Date();
  const nowSql = serializeDbDate(now);

  await db.run(sql`
    insert into ${NotificationLog} (
      id, orderId, channel, template, recipient, provider, status, attempts, createdAt, updatedAt
    ) values (
      ${id}, ${orderId}, ${draft.channel}, ${draft.template}, ${draft.recipient}, ${draft.provider}, ${NOTIFICATION_STATUS.pending}, ${0}, ${nowSql}, ${nowSql}
    )
  `);

  return id;
}

async function markLogResult(logId: string, result: { ok: boolean; error?: string }) {
  const now = new Date();
  const nowSql = serializeDbDate(now);

  await db.run(sql`
    update ${NotificationLog}
    set
      status = ${result.ok ? NOTIFICATION_STATUS.sent : NOTIFICATION_STATUS.failed},
      attempts = ${1},
      sentAt = ${result.ok ? nowSql : null},
      lastError = ${result.ok ? null : result.error ?? 'Unknown error'},
      updatedAt = ${nowSql}
    where id = ${logId}
  `);
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function dispatchOrderNotifications(event: NotificationEvent, order: PublicOrder) {
  const drafts = buildDrafts(event, order);

  await Promise.all(drafts.map(async (draft) => {
    const logId = await createLog(order.id, draft);

    const result = draft.channel === NOTIFICATION_CHANNEL.email
      ? await sendEmail({
          to: draft.recipient,
          subject: draft.subject ?? 'Actualización de pedido',
          html: draft.html ?? `<p>${draft.text}</p>`,
          text: draft.text,
        })
      : await sendWhatsApp({
          to: draft.recipient,
          body: draft.text,
        });

    await markLogResult(logId, result);
  }));
}
