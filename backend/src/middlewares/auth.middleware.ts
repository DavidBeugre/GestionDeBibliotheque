import { NextFunction, Request, Response } from 'express';
import { RoleName } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { TokenService } from '../services/token.service';

/**
 * Vérifie la présence et la validité d'un token JWT d'accès (header Authorization: Bearer ...).
 * Attache l'utilisateur authentifié à req.user pour les middlewares/controllers suivants.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Token d’authentification manquant'));
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = TokenService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };
    next();
  } catch (error) {
    next(error);
  }
}

/** Restreint l'accès à une route à une liste de rôles autorisés. */
export function authorize(...allowedRoles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden('Vous n’avez pas les droits nécessaires pour effectuer cette action'));
      return;
    }
    next();
  };
}

/** Restreint l'accès à une route à une permission granulaire précise (ex: "book:delete"). */
export function requirePermission(permissionCode: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!req.user.permissions.includes(permissionCode)) {
      next(ApiError.forbidden(`Permission requise : ${permissionCode}`));
      return;
    }
    next();
  };
}
