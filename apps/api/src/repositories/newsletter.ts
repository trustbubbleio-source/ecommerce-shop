import type { NewsletterRepository } from './interfaces.js';

export class MemoryNewsletterRepository implements NewsletterRepository {
  private readonly emails = new Set<string>();

  async subscribe(email: string): Promise<boolean> {
    const key = email.toLowerCase();
    if (this.emails.has(key)) return false;
    this.emails.add(key);
    return true;
  }
}
