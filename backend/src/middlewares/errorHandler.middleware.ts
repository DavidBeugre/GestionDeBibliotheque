import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { env } from '../config/env';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route introuvable : ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  let error = err;

  if (error instanceof multer.MulterError) {
    error = ApiError.badRequest(`Erreur d'upload : ${error.message}`);
  } else if (!(error instanceof ApiError)) {
    // Erreurs Prisma, JWT, etc. converties en ApiError générique
    const message = error.message || 'Erreur interne du serveur';
    error = new ApiError(500, message, false);
  }

  const apiError = error as ApiError;

  if (!apiError.isOperational) {
    logger.error(`${req.method} ${req.originalUrl} -> ${apiError.message}`, { stack: apiError.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${apiError.message}`);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.details ? { details: apiError.details } : {}),
    ...(env.nodeEnv === 'development' ? { stack: apiError.stack } : {}),
  });
}
