import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getClient(): ReturnType<typeof twilio> {
  if (client) return client;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Twilio no está configurado (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)');
  }
  client = twilio(accountSid, authToken);
  return client;
}

export async function sendWhatsApp(params: {
  to: string;
  body: string;
}): Promise<{ sid: string }> {
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
  const toNumber = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`;
  const message = await getClient().messages.create({
    from: fromNumber,
    to: toNumber,
    body: params.body,
  });
  return { sid: message.sid };
}
