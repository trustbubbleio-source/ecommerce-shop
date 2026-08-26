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
    const shopUrl = this.env.webOrigins[0] ?? 'https://onemorerip.cards';
    return this.send({
      to: input.email,
      subject: 'Welcome to One More Rip',
      text: `Hi ${input.name},\n\nWelcome to One More Rip — glad to have you.\n\nBrowse the shop: ${shopUrl}/shop\n\n— One More Rip`,
      html: `
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Welcome to <strong>One More Rip</strong> — glad to have you.</p>
        <p><a href="${shopUrl}/shop">Browse the shop</a></p>
        <p>— One More Rip</p>
      `,
    });
  }

  async sendEmailVerification(input: {
    name: string;
    email: string;
    verifyUrl: string;
  }): Promise<SendEmailResult> {
    return this.send({
      to: input.email,
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
      ].join('\n'),
      html: `
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Thanks for signing up. Confirm your email within <strong>24 hours</strong> to activate your account.</p>
        <p><a href="${escapeHtml(input.verifyUrl)}">Confirm email &amp; continue</a></p>
        <p style="color:#666;font-size:13px">Next you will choose a password. If you did not create an account, you can ignore this email.</p>
        <p>— One More Rip</p>
      `,
    });
  }

  async sendPasswordReset(input: {
    name: string;
    email: string;
    resetUrl: string;
  }): Promise<SendEmailResult> {
    return this.send({
      to: input.email,
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
      ].join('\n'),
      html: `
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>We received a request to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <p><a href="${escapeHtml(input.resetUrl)}">Reset your password</a></p>
        <p style="color:#666;font-size:13px">If you did not ask for this, you can ignore this email.</p>
        <p>— One More Rip</p>
      `,
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
