import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';

export function validate(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: 'path' in e ? e.path : undefined,
      message: e.msg,
    }));
    next(ApiError.badRequest('Erreur de validation des données', formatted));
    return;
  }
  next();
}
