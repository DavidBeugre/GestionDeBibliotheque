import { AuditLogFilters, AuditLogRepository } from '../repositories/auditLog.repository';
import { ApiError } from '../utils/ApiError';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';

export class AuditLogService {
  static async list(pagination: PaginationParams, filters: AuditLogFilters) {
    const { items, total } = await AuditLogRepository.findMany(
      filters,
      pagination.skip,
      pagination.limit,
      pagination.sort,
      pagination.order
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async getById(id: string) {
    const log = await AuditLogRepository.findById(id);
    if (!log) throw ApiError.notFound('Entrée de journal introuvable');
    return log;
  }
}
