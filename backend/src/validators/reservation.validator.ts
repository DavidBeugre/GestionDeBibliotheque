import { body, query } from 'express-validator';

export const createReservationValidator = [
  body('memberId').isUUID().withMessage('memberId doit être un UUID valide'),
  body('bookId').isUUID().withMessage('bookId doit être un UUID valide'),
];

export const listReservationsValidator = [
  query('memberId').optional().isUUID(),
  query('bookId').optional().isUUID(),
  query('status').optional().isIn(['PENDING', 'AVAILABLE', 'FULFILLED', 'CANCELLED', 'EXPIRED']),
];
