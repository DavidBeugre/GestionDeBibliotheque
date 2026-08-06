import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD sont requis.');
  }
  if (password.length < 16) {
    throw new Error('Le nouveau mot de passe doit comporter au moins 16 caractères.');
  }

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  if (!user || user.role.name !== RoleName.ADMIN) {
    throw new Error(`Aucun compte administrateur n'existe pour ${email}.`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(password, 12),
      passwordChangedAt: new Date(),
      resetPasswordToken: null,
      resetPasswordExpires: null,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  console.log(`Mot de passe réinitialisé pour ${email}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
