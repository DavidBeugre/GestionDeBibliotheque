import { FineStatus, PaymentMethod } from '@prisma/client';
import { FineRepository } from '../repositories/fine.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { ApiError } from '../utils/ApiError';
import { sumPayments } from '../utils/circulation.util';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';
import { AuditService } from './audit.service';
import { ActivityService } from './activity.service';
import { AuditAction } from '@prisma/client';

interface CreatePaymentInput {
  fineId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  processedById?: string;
}

export class PaymentService {
  static async list(pagination: PaginationParams, memberId?: string) {
    const where = memberId ? { memberId } : {};
    const { items, total } = await PaymentRepository.findMany(
      where as never,
      pagination.skip,
      pagination.limit,
      pagination.sort,
      pagination.order
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async getById(id: string) {
    const payment = await PaymentRepository.findById(id);
    if (!payment) throw ApiError.notFound('Paiement introuvable');
    return payment;
  }

  static async create(input: CreatePaymentInput) {
    const fine = await FineRepository.findById(input.fineId);
    if (!fine) throw ApiError.notFound('Amende introuvable');
    if (fine.status === 'PAID') throw ApiError.conflict('Cette amende est déjà entièrement payée');
    if (fine.status === 'WAIVED') throw ApiError.conflict('Cette amende a été remise, aucun paiement possible');

    const existingPayments = await PaymentRepository.findByFineId(input.fineId);
    const alreadyPaid = sumPayments(existingPayments.map((p: { amount: unknown }) => ({ amount: Number(p.amount) })));
    const remaining = Number(fine.amount) - alreadyPaid;

    if (input.amount <= 0) throw ApiError.badRequest('Le montant du paiement doit être positif');
    if (input.amount > remaining) {
      throw ApiError.badRequest(`Le montant dépasse le solde restant dû (${remaining})`);
    }

    const payment = await PaymentRepository.create({
      fine: { connect: { id: input.fineId } },
      member: { connect: { id: fine.memberId } },
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      ...(input.processedById ? { processedBy: { connect: { id: input.processedById } } } : {}),
    });

    const totalPaidNow = alreadyPaid + input.amount;
    const newStatus: FineStatus = totalPaidNow >= Number(fine.amount) ? FineStatus.PAID : FineStatus.PARTIALLY_PAID;
    await FineRepository.update(input.fineId, { status: newStatus });

    await AuditService.record(AuditAction.CREATE, { entityType: 'Payment', entityId: payment.id });
    await ActivityService.record(
      'payment.received',
      `Paiement de ${input.amount} encaissé`,
      { userId: input.processedById, entityType: 'Payment', entityId: payment.id }
    );

    return payment;
  }
}
