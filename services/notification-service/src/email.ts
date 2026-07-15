import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_ADDRESS = process.env.SMTP_FROM || "noreply@microshop.local";

const emailEnabled = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

const eventLabels: Record<string, { subject: string; body: (data: any) => string }> = {
  "order.created": {
    subject: "Order #{{orderId}} Placed Successfully",
    body: (data) =>
      `Your order #${data.orderId} has been placed successfully.\n\nTotal: $${data.totalAmount}\nItems: ${(data.items || []).length}\n\nWe'll notify you when it's confirmed.`,
  },
  "order.confirmed": {
    subject: "Order #{{orderId}} Confirmed",
    body: (data) =>
      `Your order #${data.orderId} has been confirmed!\n\nTransaction ID: ${data.transactionId}\n\nThank you for your purchase.`,
  },
  "order.cancelled": {
    subject: "Order #{{orderId}} Cancelled",
    body: (data) =>
      `Your order #${data.orderId} has been cancelled.\n\nReason: ${data.reason || "No reason provided"}\n\nIf you have any questions, please contact support.`,
  },
  "payment.completed": {
    subject: "Payment Received for Order #{{orderId}}",
    body: (data) =>
      `Payment of $${data.amount} has been received for order #${data.orderId}.\n\nTransaction ID: ${data.transactionId}`,
  },
  "payment.failed": {
    subject: "Payment Failed for Order #{{orderId}}",
    body: (data) =>
      `Payment for order #${data.orderId} has failed.\n\nReason: ${data.reason || "Unknown error"}\n\nPlease check your payment method and try again.`,
  },
};

export function formatEmail(eventType: string, data: any): { subject: string; text: string } | null {
  const template = eventLabels[eventType];
  if (!template) return null;
  let subject = template.subject;
  for (const [key, val] of Object.entries(data || {})) {
    subject = subject.replace(`{{${key}}}`, String(val));
  }
  return { subject, text: template.body(data) };
}

function extractUserEmail(data: any): string | null {
  return data?.customerEmail || data?.email || null;
}

export async function sendEmail(eventType: string, data: any): Promise<void> {
  if (!emailEnabled || !transporter) {
    console.log(`[email] Skipped (no SMTP config): ${eventType}`);
    return;
  }

  const email = extractUserEmail(data);
  if (!email) {
    console.log(`[email] Skipped (no recipient email): ${eventType}`);
    return;
  }

  const formatted = formatEmail(eventType, data);
  if (!formatted) {
    console.log(`[email] Skipped (no template): ${eventType}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: formatted.subject,
      text: formatted.text,
    });
    console.log(`[email] Sent: ${formatted.subject} -> ${email}`);
  } catch (err) {
    console.error(`[email] Failed to send: ${eventType} -> ${email}`, err);
  }
}
