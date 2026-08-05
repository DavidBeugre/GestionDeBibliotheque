import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ReservationService } from '../services/reservation.service';
import { BorrowService } from '../services/borrow.service';
import { parsePagination } from '../utils/pagination.util';

const SORTABLE_FIELDS = ['reservationDate', 'expiryDate', 'createdAt'];

export const ReservationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, SORTABLE_FIELDS, 'reservationDate');
    const { items, meta } = await ReservationService.list(pagination, {
      memberId: req.query.memberId as string | undefined,
      bookId: req.query.bookId as string | undefined,
      status: req.query.status as never,
    });
    return ApiResponse.success(res, items, 'Liste des réservations', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const reservation = await ReservationService.getById(req.params.id);
    return ApiResponse.success(res, reservation, 'Réservation');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const reservation = await ReservationService.create(req.body.memberId, req.body.bookId);
    return ApiResponse.created(res, reservation, 'Réservation créée avec succès');
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    await ReservationService.cancel(req.params.id);
    return ApiResponse.success(res, null, 'Réservation annulée');
  }),

  fulfill: asyncHandler(async (req: Request, res: Response) => {
    const borrow = await BorrowService.createFromReservation(req.params.id, req.user?.id);
    return ApiResponse.success(res, borrow, 'Réservation convertie en emprunt avec succès');
  }),

  expireOverdueBatch: asyncHandler(async (_req: Request, res: Response) => {
    const result = await ReservationService.expireOverdue();
    return ApiResponse.success(res, result, `${result.count} réservation(s) expirée(s)`);
  }),
};
