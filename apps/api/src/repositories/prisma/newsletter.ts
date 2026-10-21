import { prisma } from '@akknerds/db';
import { nanoid } from 'nanoid';
import type { NewsletterRepository, NewsletterSubscribeResult } from '../interfaces.js';

export class PrismaNewsletterRepository implements NewsletterRepository {
  async subscribe(email: string): Promise<NewsletterSubscribeResult> {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      return { created: false, unsubscribeToken: existing.unsubscribeToken };
    }

    try {
      const row = await prisma.newsletterSubscriber.create({
        data: { email, unsubscribeToken: nanoid(24) },
      });
      return { created: true, unsubscribeToken: row.unsubscribeToken };
    } catch (error) {
      // Race: another request inserted the same email.
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        const again = await prisma.newsletterSubscriber.findUnique({ where: { email } });
        if (again) return { created: false, unsubscribeToken: again.unsubscribeToken };
      }
      throw error;
    }
  }

  async unsubscribe(token: string): Promise<boolean> {
    const result = await prisma.newsletterSubscriber.deleteMany({
      where: { unsubscribeToken: token },
    });
    return result.count > 0;
  }
}
