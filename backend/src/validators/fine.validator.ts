import { body, query } from 'express-validator';

export const waiveFineValidator = [body('reason').trim().notEmpty().withMessage('Un motif de remise est requis')];

export const listFinesValidator = [
  query('memberId').optional().isUUID(),
  query('status').optional().isIn(['UNPAID', 'PAID', 'WAIVED', 'PARTIALLY_PAID']),
];

export const createPaymentValidator = [
  body('fineId').isUUID().withMessage('fineId doit être un UUID valide'),
  body('amount').isFloat({ gt: 0 }).withMessage('Le montant doit être positif'),
  body('method').isIn(['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER']).withMessage('Mode de paiement invalide'),
  body('reference').optional().isString(),
];

export const listPaymentsValidator = [query('memberId').optional().isUUID()];
