type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(payload: EmailPayload) {
  const apiKey = import.meta.env.RESEND_API_KEY as string | undefined;
  const from = import.meta.env.RESEND_FROM_EMAIL as string | undefined;

  if (!apiKey || !from) {
    const reason = 'Resend no configurado. Definí RESEND_API_KEY y RESEND_FROM_EMAIL.';
    console.warn(`[notifications/email] ${reason}`);
    return { ok: false as const, provider: 'resend', error: reason };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[notifications/email] Resend error', error);
      return { ok: false as const, provider: 'resend', error };
    }

    return { ok: true as const, provider: 'resend' };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    console.error('[notifications/email] Network error', reason);
    return { ok: false as const, provider: 'resend', error: reason };
  }
}
