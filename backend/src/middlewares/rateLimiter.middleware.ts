import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Rate limiter global appliqué à toute l'API
export const globalRateLimiter = rateLimit({
  windowMs: env.security.rateLimitWindowMs,
  max: env.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requêtes envoyées depuis cette adresse IP. Réessayez plus tard.',
  },
});

// Rate limiter strict dédié aux routes sensibles (login, reset password)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.',
  },
});
