import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { prisma } from '../src/client.js';

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@onemorerip.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'change-me-admin';
  const name = process.env.ADMIN_NAME ?? 'Admin';

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: {
      id: `usr_${nanoid(16)}`,
      email,
      name,
      passwordHash,
      role: 'admin',
      emailVerifiedAt: new Date(),
    },
    update: {
      name,
      passwordHash,
      role: 'admin',
      emailVerifiedAt: new Date(),
    },
  });

  console.info(`[db:seed-admin] Admin user ready: ${email}`);
}

main()
  .catch((error) => {
    console.error('[db:seed-admin] Failed', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
