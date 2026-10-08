import { prisma } from '@akknerds/db';
import type { NewsletterRepository } from '../interfaces.js';

export class PrismaNewsletterRepository implements NewsletterRepository {
  async subscribe(email: string): Promise<boolean> {
    try {
      await prisma.newsletterSubscriber.create({ data: { email } });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) return false;
      throw error;
    }
  }
}
