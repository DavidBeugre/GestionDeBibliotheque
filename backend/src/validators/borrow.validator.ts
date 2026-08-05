import { body, query } from 'express-validator';

export const createBorrowValidator = [
  body('memberId').isUUID().withMessage('memberId doit être un UUID valide'),
  body('bookCopyId').isUUID().withMessage('bookCopyId doit être un UUID valide'),
];

export const listBorrowsValidator = [
  query('memberId').optional().isUUID(),
  query('bookCopyId').optional().isUUID(),
  query('status').optional().isIn(['ONGOING', 'RETURNED', 'LATE', 'LOST', 'RENEWED']),
  query('overdue').optional().isBoolean(),
];
