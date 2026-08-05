import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { FineService } from '../services/fine.service';
import { PaymentService } from '../services/payment.service';
import { parsePagination } from '../utils/pagination.util';

const FINE_SORTABLE_FIELDS = ['createdAt', 'amount', 'status'];
const PAYMENT_SORTABLE_FIELDS = ['paidAt', 'amount'];

export const FineController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, FINE_SORTABLE_FIELDS, 'createdAt');
    const { items, meta } = await FineService.list(pagination, {
      memberId: req.query.memberId as string | undefined,
      status: req.query.status as never,
    });
    return ApiResponse.success(res, items, 'Liste des amendes', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const fine = await FineService.getById(req.params.id);
    return ApiResponse.success(res, fine, 'Amende');
  }),

  waive: asyncHandler(async (req: Request, res: Response) => {
    const fine = await FineService.waive(req.params.id, req.body.reason);
    return ApiResponse.success(res, fine, 'Amende remise avec succès');
  }),
};

export const PaymentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, PAYMENT_SORTABLE_FIELDS, 'paidAt');
    const { items, meta } = await PaymentService.list(pagination, req.query.memberId as string | undefined);
    return ApiResponse.success(res, items, 'Liste des paiements', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const payment = await PaymentService.getById(req.params.id);
    return ApiResponse.success(res, payment, 'Paiement');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const payment = await PaymentService.create({ ...req.body, processedById: req.user?.id });
    return ApiResponse.created(res, payment, 'Paiement enregistré avec succès');
  }),
};
