export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: MailOptions) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const from = process.env.FROM_EMAIL || user || 'no-reply@example.com';

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and optionally SMTP_SECURE, FROM_EMAIL');
  }

  const { default: nodemailer } = await import(String('nodemailer')) as any;
  const transporter = (nodemailer as any).createTransport({ host, port, auth: { user, pass }, secure } as any);
  await transporter.sendMail({ from, to, subject, html });
}
// @ts-nocheck
