import { body } from 'express-validator';

export const updateSettingsValidator = [
  body('libraryName').optional().trim().notEmpty(),
  body('address').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isEmail(),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Code devise ISO sur 3 lettres (ex: XOF, EUR)'),
  body('borrowDurationDays').optional().isInt({ min: 1, max: 90 }),
  body('maxBorrowsPerUser').optional().isInt({ min: 1, max: 20 }),
  body('finePerDay').optional().isFloat({ min: 0 }),
  body('holidays').optional().isArray(),
  body('holidays.*').optional().isISO8601(),
];
