import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../env.js';
import { EmailService } from './email.js';

describe('EmailService', () => {
  it('runs in mock mode without a real Resend key', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const email = new EmailService(loadEnv({ RESEND_API_KEY: '' }));
    expect(email.enabled).toBe(false);

    const result = await email.sendWelcome({ name: 'Ash', email: 'ash@pallet.town' });
    expect(result.mocked).toBe(true);
    expect(info).toHaveBeenCalled();
    info.mockRestore();
  });

  it('builds a contact message for the inbox', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const email = new EmailService(
      loadEnv({
        RESEND_API_KEY: '',
        EMAIL_CONTACT_INBOX: 'inbox@example.com',
      }),
    );
    await email.sendContactMessage({
      name: 'Ash',
      email: 'ash@pallet.town',
      subject: 'Hello',
      message: 'How long does shipping take?',
    });
    expect(info.mock.calls[0]?.[0]).toContain('inbox@example.com');
    info.mockRestore();
  });

  it('alerts the inbox when an order is paid', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const email = new EmailService(
      loadEnv({
        RESEND_API_KEY: '',
        EMAIL_ORDERS_INBOX: 'order@example.com',
        WEB_ORIGIN: 'http://localhost:5173',
      }),
    );
    await email.sendPaidOrderAlert({
      orderId: 'ord_1',
      email: 'ash@pallet.town',
      totalLabel: '750,00 €',
      itemSummary: 'Lost Origin Booster box',
      city: 'Båstad',
      adminUrl: 'http://localhost:5173/admin/orders/ord_1',
    });
    expect(info.mock.calls[0]?.[0]).toContain('order@example.com');
    expect(info.mock.calls[0]?.[0]).toContain('ord_1');
    info.mockRestore();
  });
});
