/**
 * Production seed — safe to run at any time.
 * Only creates records that don't already exist (upsert).
 * Never deletes or truncates data.
 *
 * Run once after first deploy:
 *   pnpm nx run api:prisma-seed-prod
 *
 * Change the default admin password immediately after first login.
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/modules/auth/password.util';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Production seed started ---');

  // ── Admin user ─────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tai.app' },
    update: {},
    create: {
      email: 'admin@tai.app',
      passwordHash: hashPassword('ChangeMe123!'),
      name: 'System Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`Admin user: ${admin.email} (${admin.id})`);
  console.log('⚠️  Change the admin password immediately after first login.');
  console.log('--- Production seed complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
