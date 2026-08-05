import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { BorrowService } from '../services/borrow.service';
import { parsePagination } from '../utils/pagination.util';

const SORTABLE_FIELDS = ['borrowDate', 'dueDate', 'returnDate', 'createdAt'];

export const BorrowController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, SORTABLE_FIELDS, 'borrowDate');
    const { items, meta } = await BorrowService.list(pagination, {
      memberId: req.query.memberId as string | undefined,
      bookCopyId: req.query.bookCopyId as string | undefined,
      status: req.query.status as never,
      overdue: req.query.overdue === 'true',
    });
    return ApiResponse.success(res, items, 'Liste des emprunts', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const borrow = await BorrowService.getById(req.params.id);
    return ApiResponse.success(res, borrow, 'Emprunt');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const borrow = await BorrowService.create(req.body, req.user?.id);
    return ApiResponse.created(res, borrow, 'Emprunt enregistré avec succès');
  }),

  returnBorrow: asyncHandler(async (req: Request, res: Response) => {
    const result = await BorrowService.returnBorrow(req.params.id, req.user?.id);
    const message = result.fine ? `Livre retourné avec retard — amende de ${result.fine.amount} générée` : 'Livre retourné avec succès';
    return ApiResponse.success(res, result, message);
  }),

  renew: asyncHandler(async (req: Request, res: Response) => {
    const borrow = await BorrowService.renew(req.params.id);
    return ApiResponse.success(res, borrow, 'Emprunt renouvelé');
  }),

  markLost: asyncHandler(async (req: Request, res: Response) => {
    const result = await BorrowService.markLost(req.params.id, req.user?.id);
    return ApiResponse.success(res, result, 'Livre déclaré perdu');
  }),

  markOverdueBatch: asyncHandler(async (_req: Request, res: Response) => {
    const result = await BorrowService.markOverdueBatch();
    return ApiResponse.success(res, result, `${result.count} emprunt(s) marqué(s) en retard`);
  }),
};
