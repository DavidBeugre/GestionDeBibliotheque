import { FineStatus } from '@prisma/client';
import { FineRepository } from '../repositories/fine.repository';
import { ApiError } from '../utils/ApiError';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';

interface FineFilters {
  memberId?: string;
  status?: FineStatus;
}

export class FineService {
  static async list(pagination: PaginationParams, filters: FineFilters) {
    const where: Record<string, unknown> = {};
    if (filters.memberId) where.memberId = filters.memberId;
    if (filters.status) where.status = filters.status;

    const { items, total } = await FineRepository.findMany(
      where as never,
      pagination.skip,
      pagination.limit,
      pagination.sort,
      pagination.order
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async getById(id: string) {
    const fine = await FineRepository.findById(id);
    if (!fine) throw ApiError.notFound('Amende introuvable');
    return fine;
  }

  static async waive(id: string, reason: string) {
    const fine = await this.getById(id);
    if (fine.status === 'PAID') {
      throw ApiError.conflict('Impossible de remettre une amende déjà payée');
    }
    const updated = await FineRepository.update(id, { status: FineStatus.WAIVED, waivedReason: reason });
    await AuditService.record(AuditAction.UPDATE, { entityType: 'Fine', entityId: id, metadata: { action: 'waive', reason } });
    return updated;
  }
}
