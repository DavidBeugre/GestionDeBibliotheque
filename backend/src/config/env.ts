import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  frontendUrl: string;

  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };

  cookieSecret: string;

  security: {
    bcryptSaltRounds: number;
    maxLoginAttempts: number;
    lockTimeMinutes: number;
    rateLimitWindowMs: number;
    rateLimitMax: number;
  };

  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
  };

  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };

  business: {
    defaultBorrowDurationDays: number;
    defaultMaxBorrowsPerUser: number;
    defaultFinePerDay: number;
    reservationExpiryHours: number;
  };
}

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`❌ Variable d'environnement manquante : ${key}`);
  }
  return value;
}

export const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET', 'dev_access_secret'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  cookieSecret: requireEnv('COOKIE_SECRET', 'dev_cookie_secret'),

  security: {
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
    maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS ?? 5),
    lockTimeMinutes: Number(process.env.LOCK_TIME_MINUTES ?? 15),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 100),
  },

  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.EMAIL_FROM ?? 'Bibliothèque <no-reply@library.com>',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  business: {
    defaultBorrowDurationDays: Number(process.env.DEFAULT_BORROW_DURATION_DAYS ?? 14),
    defaultMaxBorrowsPerUser: Number(process.env.DEFAULT_MAX_BORROWS_PER_USER ?? 3),
    defaultFinePerDay: Number(process.env.DEFAULT_FINE_PER_DAY ?? 100),
    reservationExpiryHours: Number(process.env.RESERVATION_EXPIRY_HOURS ?? 48),
  },
};
