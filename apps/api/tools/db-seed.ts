import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { randomBytes } from 'node:crypto';

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@wendy';
  const tenantId = 'default';
  const tenantSuffix = 'wendy';
  const tenantDisplayName = 'Vineyards';
  const costFactor = 12;

  try {
    await prisma.tenants.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        email_suffix: tenantSuffix,
        display_name: tenantDisplayName,
      },
    });

    const existingAdmin = await prisma.users.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      if (existingAdmin.role === 'Administrator') {
        console.log(`✓ Default Administrator "${email}" already exists. Skipping seed.`);
        return;
      }

      throw new Error(
        `Conflict: user "${email}" exists with role "${existingAdmin.role}", but we need role "Administrator". ` +
        `Please resolve this conflict manually in the database before redeploying.`,
      );
    }

    const randomPassword = process.env.SEED_ADMIN_PASSWORD
      ?? randomBytes(24).toString('base64');
    const passwordHash = await hash(randomPassword, costFactor);

    await prisma.users.create({
      data: {
        id: randomBytes(8).toString('base64url'),
        email,
        full_name: 'Administrator',
        password_hash: passwordHash,
        role: 'Administrator',
        tenant_id: tenantId,
        is_disabled: false,
      },
    });
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  🔐 COPY THIS PASSWORD — IT WILL NOT BE SHOWN AGAIN  🔐        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Admin Email:    ${email}`);
    console.log(`Admin Password: ${randomPassword}`);
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('   1. Save this password in a secure location (e.g., password manager).');
    console.log('   2. Share it with Vineyards out-of-band (not via email or chat).');
    console.log('   3. The Administrator must change it after first login (voluntary).');
    console.log('');
  } catch (err) {
    console.error('❌ Seed failed:', (err as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
