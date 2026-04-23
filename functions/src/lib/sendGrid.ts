import sgMail from '@sendgrid/mail';

let initialized = false;

function ensureInit() {
  if (initialized) return;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SendGrid no está configurado (SENDGRID_API_KEY)');
  }
  sgMail.setApiKey(apiKey);
  initialized = true;
}

export async function sendEmail(params: {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html: string;
  categories?: string[];
}): Promise<void> {
  ensureInit();
  const fromEmail = process.env.FROM_EMAIL || 'noreply@kuneo.app';
  await sgMail.send({
    to: params.toName ? { email: params.to, name: params.toName } : params.to,
    from: { email: fromEmail, name: 'Kuneo Facilities' },
    replyTo: fromEmail,
    subject: params.subject,
    text: params.text,
    html: params.html,
    headers: {
      'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
      'Precedence': 'bulk',
      'X-Auto-Response-Suppress': 'OOF',
    },
    categories: params.categories || ['notification'],
  });
}
