import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

const adminPermissions = [
  'book:create',
  'book:read',
  'book:update',
  'book:delete',
  'member:manage',
  'borrow:manage',
  'fine:manage',
  'report:view',
  'settings:manage',
  'user:manage',
];

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() ?? 'Administrateur';
  const lastName = process.env.ADMIN_LAST_NAME?.trim() ?? 'Shelfly';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD sont requis.');
  }
  if (password.length < 16) {
    throw new Error('Le mot de passe administrateur doit comporter au moins 16 caractères.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`Un compte existe déjà pour ${email}.`);
  }

  await Promise.all(
    adminPermissions.map((code) =>
      prisma.permission.upsert({ where: { code }, update: {}, create: { code, description: code } })
    )
  );

  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: { permissions: { set: adminPermissions.map((code) => ({ code })) } },
    create: {
      name: RoleName.ADMIN,
      description: 'Administrateur',
      permissions: { connect: adminPermissions.map((code) => ({ code })) },
    },
  });

  await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 12),
      firstName,
      lastName,
      roleId: adminRole.id,
      isEmailVerified: true,
    },
  });

  console.log(`Compte administrateur créé pour ${email}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
