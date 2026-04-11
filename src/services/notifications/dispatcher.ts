import { db, NotificationLog, sql } from 'astro:db';
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

function buildDrafts(event: NotificationEvent, order: PublicOrder): NotificationDraft[] {
  const admin = adminRecipients();
  const ref = `Pedido ${order.id.slice(0, 8).toUpperCase()}`;

  if (event === 'payment_proof_uploaded') {
    return [
      {
        channel: NOTIFICATION_CHANNEL.email,
        template: event,
        recipient: order.customerEmail,
        provider: 'resend',
        subject: `Recibimos tu comprobante · ${ref}`,
        text: `Hola ${order.customerName}, recibimos tu comprobante del ${ref}. Ya quedó en revisión.`,
        html: `<p>Hola ${order.customerName},</p><p>Recibimos tu comprobante del <strong>${ref}</strong>. Ya quedó en revisión.</p>`,
      },
      {
        channel: NOTIFICATION_CHANNEL.whatsapp,
        template: event,
        recipient: order.customerPhone,
        provider: 'whatsapp-cloud',
        text: `Recibimos tu comprobante del ${ref}. Ya quedó en revisión.`,
      },
      ...(admin.email ? [{
        channel: NOTIFICATION_CHANNEL.email,
        template: event,
        recipient: admin.email,
        provider: 'resend',
        subject: `Nuevo comprobante pendiente · ${ref}`,
        text: `Entró un nuevo comprobante para revisar. Cliente: ${order.customerName}. Total: ${order.total}.`,
        html: `<p>Entró un nuevo comprobante para revisar.</p><p><strong>${ref}</strong><br/>Cliente: ${order.customerName}<br/>Total: ${order.total}</p>`,
      }] : []),
      ...(admin.whatsapp ? [{
        channel: NOTIFICATION_CHANNEL.whatsapp,
        template: event,
        recipient: admin.whatsapp,
        provider: 'whatsapp-cloud',
        text: `Nuevo comprobante pendiente para ${ref}. Revisalo en /admin/orders.`,
      }] : []),
    ];
  }

  if (event === 'payment_approved') {
    return [
      {
        channel: NOTIFICATION_CHANNEL.email,
        template: event,
        recipient: order.customerEmail,
        provider: 'resend',
        subject: `Pago aprobado · ${ref}`,
        text: `Hola ${order.customerName}, tu pago del ${ref} fue aprobado.`,
        html: `<p>Hola ${order.customerName},</p><p>Tu pago del <strong>${ref}</strong> fue aprobado.</p>`,
      },
      {
        channel: NOTIFICATION_CHANNEL.whatsapp,
        template: event,
        recipient: order.customerPhone,
        provider: 'whatsapp-cloud',
        text: `¡Pago aprobado! El ${ref} ya quedó confirmado.`,
      },
      ...(admin.email ? [{
        channel: NOTIFICATION_CHANNEL.email,
        template: event,
        recipient: admin.email,
        provider: 'resend',
        subject: `Pago aprobado internamente · ${ref}`,
        text: `Se aprobó el pago del ${ref}.`,
        html: `<p>Se aprobó el pago del <strong>${ref}</strong>.</p>`,
      }] : []),
      ...(admin.whatsapp ? [{
        channel: NOTIFICATION_CHANNEL.whatsapp,
        template: event,
        recipient: admin.whatsapp,
        provider: 'whatsapp-cloud',
        text: `Pago aprobado para ${ref}.`,
      }] : []),
    ];
  }

  return [
    {
      channel: NOTIFICATION_CHANNEL.email,
      template: event,
      recipient: order.customerEmail,
      provider: 'resend',
      subject: `Pago rechazado · ${ref}`,
      text: `Hola ${order.customerName}, el comprobante del ${ref} fue rechazado. Motivo: ${order.payment.rejectionReason ?? 'sin detalle adicional'}.`,
      html: `<p>Hola ${order.customerName},</p><p>El comprobante del <strong>${ref}</strong> fue rechazado.</p><p>Motivo: ${order.payment.rejectionReason ?? 'sin detalle adicional'}.</p>`,
    },
    {
      channel: NOTIFICATION_CHANNEL.whatsapp,
      template: event,
      recipient: order.customerPhone,
      provider: 'whatsapp-cloud',
      text: `El comprobante del ${ref} fue rechazado. Motivo: ${order.payment.rejectionReason ?? 'sin detalle adicional'}. Podés subir uno nuevo desde tu link público.`,
    },
    ...(admin.email ? [{
      channel: NOTIFICATION_CHANNEL.email,
      template: event,
      recipient: admin.email,
      provider: 'resend',
      subject: `Pago rechazado internamente · ${ref}`,
      text: `Se rechazó el pago del ${ref}.`,
      html: `<p>Se rechazó el pago del <strong>${ref}</strong>.</p>`,
    }] : []),
    ...(admin.whatsapp ? [{
      channel: NOTIFICATION_CHANNEL.whatsapp,
      template: event,
      recipient: admin.whatsapp,
      provider: 'whatsapp-cloud',
      text: `Pago rechazado para ${ref}.`,
    }] : []),
  ];
}

async function createLog(orderId: string, draft: NotificationDraft) {
  const id = randomUUID();
  const now = new Date();

  await db.run(sql`
    insert into ${NotificationLog} (
      id, orderId, channel, template, recipient, provider, status, attempts, createdAt, updatedAt
    ) values (
      ${id}, ${orderId}, ${draft.channel}, ${draft.template}, ${draft.recipient}, ${draft.provider}, ${NOTIFICATION_STATUS.pending}, ${0}, ${now}, ${now}
    )
  `);

  return id;
}

async function markLogResult(logId: string, result: { ok: boolean; error?: string }) {
  const now = new Date();

  await db.run(sql`
    update ${NotificationLog}
    set
      status = ${result.ok ? NOTIFICATION_STATUS.sent : NOTIFICATION_STATUS.failed},
      attempts = ${1},
      sentAt = ${result.ok ? now : null},
      lastError = ${result.ok ? null : result.error ?? 'Unknown error'},
      updatedAt = ${now}
    where id = ${logId}
  `);
}

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
