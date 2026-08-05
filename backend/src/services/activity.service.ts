import { ActivityLogRepository } from '../repositories/activityLog.repository';
import { logger } from '../config/logger';

export class ActivityService {
  static async record(
    action: string,
    description: string,
    ctx: { userId?: string; entityType?: string; entityId?: string } = {}
  ): Promise<void> {
    try {
      await ActivityLogRepository.create({ action, description, ...ctx });
    } catch (error) {
      // Comme pour l'audit, l'activité récente ne doit jamais interrompre le flux principal.
      logger.error('[ActivityService] Échec d’écriture du fil d’activité', error);
    }
  }

  static list(limit = 20) {
    return ActivityLogRepository.findRecent(limit);
  }
}
