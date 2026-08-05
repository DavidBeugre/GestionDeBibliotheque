import jwt from 'jsonwebtoken';
import { RoleName } from '@prisma/client';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { generateOpaqueToken, hashToken } from '../utils/crypto.util';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: RoleName;
  permissions: string[];
}

export class TokenService {
  static signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.jwt.accessSecret, {
      expiresIn: env.jwt.accessExpiresIn,
      issuer: 'library-management-api',
    } as jwt.SignOptions);
  }

  static verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, env.jwt.accessSecret, {
        issuer: 'library-management-api',
      }) as AccessTokenPayload;
    } catch {
      throw ApiError.unauthorized('Token d’accès invalide ou expiré');
    }
  }

  /**
   * Génère un refresh token opaque (non-JWT) : le secret brut est renvoyé au client
   * (cookie httpOnly), seul son empreinte SHA-256 est stockée en base (table Session).
   */
  static generateRefreshToken(): { raw: string; hashed: string } {
    const raw = generateOpaqueToken();
    return { raw, hashed: hashToken(raw) };
  }

  static hashRefreshToken(raw: string): string {
    return hashToken(raw);
  }
}
