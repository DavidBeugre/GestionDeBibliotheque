import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.port, '0.0.0.0', () => {
    logger.info(`🚀 Serveur démarré sur le port ${env.port} [${env.nodeEnv}]`);
    logger.info(`📚 API disponible sur http://localhost:${env.port}${env.apiPrefix}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} reçu. Arrêt gracieux du serveur...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Serveur arrêté proprement.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

bootstrap();
