import { nanoid } from 'nanoid';
import type { NewsletterRepository, NewsletterSubscribeResult } from './interfaces.js';

/** In-memory newsletter list, isolated per app instance. */
export class MemoryNewsletterRepository implements NewsletterRepository {
  private readonly byEmail = new Map<string, string>();
  private readonly byToken = new Map<string, string>();

  async subscribe(email: string): Promise<NewsletterSubscribeResult> {
    const key = email.toLowerCase();
    const existing = this.byEmail.get(key);
    if (existing) {
      return { created: false, unsubscribeToken: existing };
    }
    const unsubscribeToken = nanoid(24);
    this.byEmail.set(key, unsubscribeToken);
    this.byToken.set(unsubscribeToken, key);
    return { created: true, unsubscribeToken };
  }

  async unsubscribe(token: string): Promise<boolean> {
    const email = this.byToken.get(token);
    if (!email) return false;
    this.byToken.delete(token);
    this.byEmail.delete(email);
    return true;
  }
}
