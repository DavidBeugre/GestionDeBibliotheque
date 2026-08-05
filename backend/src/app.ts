import express, { Application, Request, Response } from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { logger } from './config/logger';
import { swaggerSpec } from './config/swagger';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import apiRouter from './routes';

export function createApp(): Application {
  const app = express();

  // ---------- Sécurité HTTP ----------
  app.use(
    helmet({
      contentSecurityPolicy: env.nodeEnv === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // ---------- CORS (frontend autorisé uniquement) ----------
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    })
  );

  // ---------- Parsing ----------
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.cookieSecret));

  // ---------- Compression des réponses ----------
  app.use(compression());

  // ---------- Logs HTTP ----------
  app.use(
    morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
      stream: { write: (message: string) => logger.info(message.trim()) },
    })
  );

  // ---------- Rate limiting global ----------
  app.use(globalRateLimiter);

  // ---------- Fichiers statiques (uploads locaux, secours si Cloudinary indisponible) ----------
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // ---------- Healthcheck ----------
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'API Bibliothèque opérationnelle',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  // ---------- Documentation Swagger ----------
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // ---------- Routes API ----------
  app.use(env.apiPrefix, apiRouter);

  // ---------- 404 & gestion des erreurs ----------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
