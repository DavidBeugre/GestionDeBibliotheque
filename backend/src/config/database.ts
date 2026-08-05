import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: env.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (env.nodeEnv !== 'production') {
  global.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Connexion à la base de données PostgreSQL établie');
  } catch (error) {
    logger.error('❌ Échec de connexion à la base de données', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
