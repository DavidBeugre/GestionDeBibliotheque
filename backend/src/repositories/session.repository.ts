import { prisma } from '../config/database';
import { env } from '../config/env';

export class SessionRepository {
  static create(data: { userId: string; hashedRefreshToken: string; ipAddress?: string; userAgent?: string }) {
    const expiresAt = new Date(Date.now() + parseExpiryMs(env.jwt.refreshExpiresIn));
    return prisma.session.create({
      data: {
        userId: data.userId,
        refreshToken: data.hashedRefreshToken,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt,
      },
    });
  }

  static findByHashedToken(hashedToken: string) {
    return prisma.session.findUnique({ where: { refreshToken: hashedToken } });
  }

  static revoke(sessionId: string) {
    return prisma.session.update({ where: { id: sessionId }, data: { isRevoked: true } });
  }

  static revokeAllForUser(userId: string) {
    return prisma.session.updateMany({ where: { userId, isRevoked: false }, data: { isRevoked: true } });
  }

  static listActiveForUser(userId: string) {
    return prisma.session.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

/** Convertit une chaîne de type "15m", "7d", "1h" en millisecondes. */
function parseExpiryMs(expiry: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback 7 jours

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multipliers[unit];
}
