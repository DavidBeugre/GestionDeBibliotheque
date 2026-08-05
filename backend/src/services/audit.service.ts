import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

export class AuditService {
  static async record(action: AuditAction, ctx: AuditContext = {}): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          userId: ctx.userId,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          entityType: ctx.entityType,
          entityId: ctx.entityId,
          metadata: ctx.metadata,
        },
      });
    } catch (error) {
      // L'audit ne doit jamais interrompre le flux principal de l'application.
      logger.error('[AuditService] Échec d’écriture du journal d’audit', error);
    }
  }
}
