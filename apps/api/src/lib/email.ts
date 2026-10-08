import { formatPrice, type Order } from '@akknerds/shared';
import { Resend } from 'resend';
import type { Env } from '../env.js';

export interface SendEmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Overrides the default from address when needed. */
  from?: string;
  attachments?: SendEmailAttachment[];
}

export interface SendEmailResult {
  id: string;
  mocked: boolean;
}

/**
 * Thin email sender. Uses Resend when `RESEND_API_KEY` is set; otherwise logs
 * the payload (same pattern as Stripe mock mode) so local/dev still works.
 */
export class EmailService {
  private readonly client: Resend | null;

  constructor(private readonly env: Env) {
    this.client = env.email.enabled ? new Resend(env.email.apiKey) : null;
  }

  get enabled(): boolean {
    return this.env.email.enabled;
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const from = input.from ?? this.env.email.from;
    const to = Array.isArray(input.to) ? input.to : [input.to];

    if (!this.client) {
      const attachmentNote = input.attachments?.length
        ? ` attachments=${input.attachments.length}(${input.attachments
            .map((a) => `${a.filename}:${a.content.byteLength}b`)
            .join(',')})`
        : '';
      console.info(
        `[email:mock] to=${to.join(',')} subject=${JSON.stringify(input.subject)} from=${from}${attachmentNote}`,
      );
      return { id: `mock_${Date.now()}`, mocked: true };
    }

    const { data, error } = await this.client.emails.send({
      from,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    if (error) {
      throw new Error(error.message || 'Failed to send email');
    }

    return { id: data?.id ?? 'unknown', mocked: false };
  }

  async sendContactMessage(input: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<SendEmailResult> {
    const safeSubject = input.subject.slice(0, 120);
    return this.send({
      to: this.env.email.contactInbox,
      replyTo: input.email,
      subject: `[Contact] ${safeSubject}`,
      text: [
        `From: ${input.name} <${input.email}>`,
        `Subject: ${input.subject}`,
        '',
        input.message,
      ].join('\n'),
      html: `
        <p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
        <hr />
        <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
      `,
    });
  }

  async sendSellRequest(input: {
    name: string;
    email: string;
    userId: string;
    notes: string;
    items: Array<{ title: string; notes: string; condition: string; hasPhoto: boolean }>;
    attachments?: SendEmailAttachment[];
  }): Promise<SendEmailResult> {
    const photoCount = input.attachments?.length ?? input.items.filter((item) => item.hasPhoto).length;
    const lines = input.items.map((item, index) => {
      const bits = [
        `${index + 1}. ${item.title}`,
        item.condition ? `condition=${item.condition}` : null,
        item.hasPhoto ? 'photo=yes' : 'photo=no',
        item.notes ? `notes=${item.notes}` : null,
      ].filter(Boolean);
      return bits.join(' | ');
    });

    return this.send({
      to: this.env.email.contactInbox,
      replyTo: input.email,
      subject: `[Sell] ${input.items.length} card(s) from ${input.name}`,
      text: [
        `From: ${input.name} <${input.email}>`,
        `User ID: ${input.userId}`,
        `Cards: ${input.items.length}`,
        `Photo attachments: ${photoCount}`,
        '',
        input.notes ? `Seller notes:\n${input.notes}\n` : '',
        'Items:',
        ...lines,
      ].join('\n'),
      html: `
        <p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
        <p><strong>User ID:</strong> ${escapeHtml(input.userId)}</p>
        <p><strong>Cards:</strong> ${input.items.length} · <strong>Photo attachments:</strong> ${photoCount}</p>
        ${
          input.notes
            ? `<p><strong>Seller notes:</strong></p><p style="white-space:pre-wrap">${escapeHtml(input.notes)}</p>`
            : ''
        }
        <hr />
        <ol>
          ${input.items
            .map(
              (item) => `
            <li>
              <strong>${escapeHtml(item.title)}</strong>
              ${item.condition ? ` · ${escapeHtml(item.condition)}` : ''}
              ${item.hasPhoto ? ' · photo attached' : ''}
              ${item.notes ? `<div style="color:#666;white-space:pre-wrap">${escapeHtml(item.notes)}</div>` : ''}
            </li>`,
            )
            .join('')}
        </ol>
        <p style="color:#666;font-size:13px">Card photos are attached to this email when provided.</p>
      `,
      attachments: input.attachments,
    });
  }

  async sendWantListAlert(input: {
    name: string;
    email: string;
    userId: string;
    presetLabel: string;
    title: string;
    notes: string;
  }): Promise<SendEmailResult> {
    return this.send({
      to: this.env.email.contactInbox,
      replyTo: input.email,
      subject: `[Want list] ${input.presetLabel} — ${input.title.slice(0, 60)}`,
      text: [
        `From: ${input.name} <${input.email}>`,
        `User ID: ${input.userId}`,
        `Preset: ${input.presetLabel}`,
        `Looking for: ${input.title}`,
        '',
        input.notes ? `Notes:\n${input.notes}` : '',
      ].join('\n'),
      html: `
        <p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
        <p><strong>User ID:</strong> ${escapeHtml(input.userId)}</p>
        <p><strong>Preset:</strong> ${escapeHtml(input.presetLabel)}</p>
        <p><strong>Looking for:</strong> ${escapeHtml(input.title)}</p>
        ${
          input.notes
            ? `<p><strong>Notes:</strong></p><p style="white-space:pre-wrap">${escapeHtml(input.notes)}</p>`
            : ''
        }
      `,
    });
  }

  async sendWelcome(input: { name: string; email: string }): Promise<SendEmailResult> {
    const shopUrl = `${this.env.webOrigins[0] ?? 'https://www.onemorerip.cards'}/shop`;
    return this.send({
      to: input.email,
      replyTo: this.env.email.contactInbox,
      subject: 'Welcome to One More Rip',
      text: `Hi ${input.name},\n\nWelcome to One More Rip.\n\nBrowse the shop: ${shopUrl}\n\n— One More Rip\nHallandsvägen 21, 269 36 Båstad, Sweden`,
      html: brandedEmail({
        preheader: 'Welcome to One More Rip.',
        title: `Hi ${escapeHtml(input.name)},`,
        body: '<p style="margin:0 0 16px;">Welcome to One More Rip. Your account is ready.</p>',
        actionLabel: 'Browse the shop',
        actionUrl: shopUrl,
      }),
    });
  }

  async sendEmailVerification(input: {
    name: string;
    email: string;
    verifyUrl: string;
  }): Promise<SendEmailResult> {
    return this.send({
      to: input.email,
      replyTo: this.env.email.contactInbox,
      subject: 'Confirm your One More Rip account',
      text: [
        `Hi ${input.name},`,
        '',
        'Thanks for signing up. Open this link within 24 hours to confirm your email and finish setting up your account:',
        input.verifyUrl,
        '',
        'After you confirm, you will choose a password.',
        '',
        'If you did not create an account, you can ignore this email.',
        '',
        '— One More Rip',
        'Hallandsvägen 21, 269 36 Båstad, Sweden',
      ].join('\n'),
      html: brandedEmail({
        preheader: 'Confirm your email to finish creating your One More Rip account.',
        title: `Hi ${escapeHtml(input.name)},`,
        body: '<p style="margin:0 0 16px;">Thanks for signing up. Confirm your email within <strong>24 hours</strong> to activate your account. Next you will choose a password.</p>',
        actionLabel: 'Confirm email',
        actionUrl: input.verifyUrl,
        footnote: 'If you did not create an account, you can ignore this email.',
      }),
    });
  }

  async sendPasswordReset(input: {
    name: string;
    email: string;
    resetUrl: string;
  }): Promise<SendEmailResult> {
    return this.send({
      to: input.email,
      replyTo: this.env.email.contactInbox,
      subject: 'Reset your One More Rip password',
      text: [
        `Hi ${input.name},`,
        '',
        'We received a request to reset your password. Open this link within 1 hour:',
        input.resetUrl,
        '',
        'If you did not ask for this, you can ignore this email.',
        '',
        '— One More Rip',
        'Hallandsvägen 21, 269 36 Båstad, Sweden',
      ].join('\n'),
      html: brandedEmail({
        preheader: 'Reset your One More Rip password. This link expires in 1 hour.',
        title: `Hi ${escapeHtml(input.name)},`,
        body: '<p style="margin:0 0 16px;">We received a request to reset your password. This link expires in <strong>1 hour</strong>.</p>',
        actionLabel: 'Reset password',
        actionUrl: input.resetUrl,
        footnote: 'If you did not ask for this, you can ignore this email.',
      }),
    });
  }

  async sendOrderConfirmation(order: Order, orderUrl: string): Promise<SendEmailResult> {
    const name = order.shippingAddress?.fullName?.trim() || 'there';
    const items = order.lines
      .map(
        (line) =>
          `<li style="margin:0 0 6px;">${line.quantity} × ${escapeHtml(line.name)} — ${escapeHtml(formatPrice(line.unitPrice * line.quantity, order.currency))}</li>`,
      )
      .join('');
    const total = formatPrice(order.total, order.currency);
    return this.send({
      to: order.email,
      replyTo: this.env.email.ordersInbox,
      subject: `Order confirmed — ${order.id}`,
      text: [
        `Hi ${name},`,
        '',
        `We've received your order ${order.id}.`,
        ...order.lines.map(
          (line) =>
            `${line.quantity} × ${line.name} — ${formatPrice(line.unitPrice * line.quantity, order.currency)}`,
        ),
        `Total: ${total}`,
        '',
        `View your order: ${orderUrl}`,
        '',
        '— One More Rip',
      ].join('\n'),
      html: brandedEmail({
        preheader: `Order ${order.id} is confirmed.`,
        title: `Hi ${escapeHtml(name)},`,
        body: `<p style="margin:0 0 12px;">We've received your order <strong>${escapeHtml(order.id)}</strong>.</p><ul style="margin:0 0 12px;padding-left:18px;">${items}</ul><p style="margin:0 0 16px;">Total: <strong>${escapeHtml(total)}</strong></p>`,
        actionLabel: 'View your order',
        actionUrl: orderUrl,
      }),
    });
  }

  async sendOrderRefunded(order: Order, orderUrl: string): Promise<SendEmailResult> {
    const name = order.shippingAddress?.fullName?.trim() || 'there';
    const total = formatPrice(order.total, order.currency);
    return this.send({
      to: order.email,
      replyTo: this.env.email.ordersInbox,
      subject: `Refund sent — ${order.id}`,
      text: [
        `Hi ${name},`,
        '',
        `We've refunded ${total} for order ${order.id}.`,
        'It can take several business days to show on your card.',
        '',
        `View your order: ${orderUrl}`,
        '',
        '— One More Rip',
      ].join('\n'),
      html: brandedEmail({
        preheader: `Refund for order ${order.id} is on the way.`,
        title: `Hi ${escapeHtml(name)},`,
        body: `<p style="margin:0 0 16px;">We've refunded <strong>${escapeHtml(total)}</strong> for order <strong>${escapeHtml(order.id)}</strong>. It can take several business days to show on your card.</p>`,
        actionLabel: 'View your order',
        actionUrl: orderUrl,
      }),
    });
  }

  async sendOrderCancelled(
    order: Order,
    orderUrl: string,
    input: { reason: string; refunded: boolean },
  ): Promise<SendEmailResult> {
    const name = order.shippingAddress?.fullName?.trim() || 'there';
    const reason = input.reason.trim();
    const total = formatPrice(order.total, order.currency);
    const refundText = input.refunded
      ? `We've refunded ${total}. It can take several business days to show on your card.`
      : '';
    const refundHtml = input.refunded
      ? `<p style="margin:0 0 16px;">We've refunded <strong>${escapeHtml(total)}</strong>. It can take several business days to show on your card.</p>`
      : '';
    return this.send({
      to: order.email,
      replyTo: this.env.email.ordersInbox,
      subject: `Order cancelled — ${order.id}`,
      text: [
        `Hi ${name},`,
        '',
        `We've cancelled order ${order.id}.`,
        reason,
        ...(refundText ? ['', refundText] : []),
        '',
        `View your order: ${orderUrl}`,
        '',
        '— One More Rip',
      ].join('\n'),
      html: brandedEmail({
        preheader: `Order ${order.id} was cancelled.`,
        title: `Hi ${escapeHtml(name)},`,
        body: `<p style="margin:0 0 12px;">We've cancelled order <strong>${escapeHtml(order.id)}</strong>.</p><p style="margin:0 0 16px;">${escapeHtml(reason)}</p>${refundHtml}`,
        actionLabel: 'View your order',
        actionUrl: orderUrl,
      }),
    });
  }

  async sendNewsletterConfirmation(email: string): Promise<SendEmailResult> {
    const shopUrl = `${this.env.webOrigins[0] ?? 'https://www.onemorerip.cards'}/shop`;
    return this.send({
      to: email,
      replyTo: this.env.email.contactInbox,
      subject: "You're on the One More Rip list",
      text: `You're signed up for drop alerts from One More Rip.\n\nBrowse the shop: ${shopUrl}\n\n— One More Rip`,
      html: brandedEmail({
        preheader: "You're on the list for new drops and restocks.",
        title: "You're on the list",
        body: '<p style="margin:0 0 16px;">New drops and restocks will land in this inbox.</p>',
        actionLabel: 'Browse the shop',
        actionUrl: shopUrl,
      }),
    });
  }

  async sendPaidOrderAlert(input: {
    orderId: string;
    email: string;
    totalLabel: string;
    itemSummary: string;
    city?: string;
    adminUrl: string;
  }): Promise<SendEmailResult> {
    const where = input.city ? ` · ${input.city}` : '';
    return this.send({
      to: this.env.email.ordersInbox,
      subject: `[Order paid] ${input.orderId} — ${input.totalLabel}`,
      text: [
        `Paid order ${input.orderId}`,
        `Customer: ${input.email}${where}`,
        `Items: ${input.itemSummary}`,
        `Total: ${input.totalLabel}`,
        '',
        `Pack it: ${input.adminUrl}`,
      ].join('\n'),
      html: `
        <p><strong>Paid order</strong> <code>${escapeHtml(input.orderId)}</code></p>
        <p><strong>Customer:</strong> ${escapeHtml(input.email)}${where ? escapeHtml(where) : ''}</p>
        <p><strong>Items:</strong> ${escapeHtml(input.itemSummary)}</p>
        <p><strong>Total:</strong> ${escapeHtml(input.totalLabel)}</p>
        <p><a href="${escapeHtml(input.adminUrl)}">Open in Admin → Orders</a></p>
      `,
    });
  }
}

const LOGO_URL = 'https://www.onemorerip.cards/apple-touch-icon.png';

/** Customer mail: dark card, logo, and one button. Inbox avatars are not controlled by this HTML. */
export function brandedEmail(input: {
  preheader: string;
  title: string;
  body: string;
  actionLabel: string;
  actionUrl: string;
  footnote?: string;
}): string {
  const href = escapeHtml(input.actionUrl);
  const footnote = input.footnote
    ? `<p style="margin:20px 0 0;color:#8a8a8a;font-size:13px;line-height:1.5;">${escapeHtml(input.footnote)}</p>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0a0a0a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#141414;border:1px solid #2a2a2a;border-radius:16px;">
            <tr>
              <td align="center" style="padding:28px 28px 0;">
                <img src="${LOGO_URL}" width="56" height="56" alt="One More Rip" style="display:block;border:0;border-radius:12px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;font-size:15px;line-height:1.5;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;">${input.title}</h1>
                ${input.body}
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                  <tr>
                    <td style="border-radius:10px;background:#7c3aed;">
                      <a href="${href}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(input.actionLabel)}</a>
                    </td>
                  </tr>
                </table>
                ${footnote}
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;color:#8a8a8a;font-size:12px;line-height:1.5;">One More Rip · Hallandsvägen 21, 269 36 Båstad, Sweden</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
