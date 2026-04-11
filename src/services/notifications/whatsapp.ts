type WhatsAppPayload = {
  to: string;
  body: string;
};

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, '');
}

export async function sendWhatsApp(payload: WhatsAppPayload) {
  const apiToken = import.meta.env.WHATSAPP_CLOUD_API_TOKEN as string | undefined;
  const phoneNumberId = import.meta.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID as string | undefined;

  if (!apiToken || !phoneNumberId) {
    const reason = 'WhatsApp Cloud API no configurada. Definí WHATSAPP_CLOUD_API_TOKEN y WHATSAPP_CLOUD_PHONE_NUMBER_ID.';
    console.warn(`[notifications/whatsapp] ${reason}`);
    return { ok: false as const, provider: 'whatsapp-cloud', error: reason };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizePhone(payload.to),
        type: 'text',
        text: {
          preview_url: false,
          body: payload.body,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[notifications/whatsapp] WhatsApp Cloud error', error);
      return { ok: false as const, provider: 'whatsapp-cloud', error };
    }

    return { ok: true as const, provider: 'whatsapp-cloud' };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    console.error('[notifications/whatsapp] Network error', reason);
    return { ok: false as const, provider: 'whatsapp-cloud', error: reason };
  }
}
