import { body, query } from 'express-validator';

export const createBookValidator = [
  body('title').trim().notEmpty().withMessage('Le titre est requis'),
  body('subtitle').optional().isString(),
  body('isbn').optional().isISBN().withMessage('ISBN invalide'),
  body('summary').optional().isString(),
  body('description').optional().isString(),
  body('categoryId').optional().isUUID(),
  body('publisherId').optional().isUUID(),
  body('authorIds').optional().isArray().withMessage('authorIds doit être un tableau'),
  body('authorIds.*').optional().isUUID(),
  body('collection').optional().isString(),
  body('edition').optional().isString(),
  body('year').optional().isInt({ min: 0, max: new Date().getFullYear() }),
  body('pageCount').optional().isInt({ min: 1 }),
  body('language').optional().isString(),
  body('callNumber').optional().isString(),
  body('location').optional().isString(),
  body('condition').optional().isIn(['NEW', 'GOOD', 'WORN', 'DAMAGED', 'LOST']),
  body('price').optional().isFloat({ min: 0 }),
  body('purchaseDate').optional().isISO8601(),
  body('acquisitionSource').optional().isIn(['PURCHASE', 'DONATION', 'EXCHANGE', 'OTHER']),
  body('tags').optional().isArray(),
  body('keywords').optional().isArray(),
  body('digitalFileUrl').optional({ values: 'falsy' }).isURL(),
  body('externalLink').optional({ values: 'falsy' }).isURL(),
];

export const updateBookValidator = [
  body('title').optional().trim().notEmpty(),
  body('isbn').optional().isISBN(),
  body('categoryId').optional().isUUID(),
  body('publisherId').optional().isUUID(),
  body('authorIds').optional().isArray(),
  body('authorIds.*').optional().isUUID(),
  body('year').optional().isInt({ min: 0, max: new Date().getFullYear() }),
  body('status').optional().isIn(['ACTIVE', 'ARCHIVED', 'OUT_OF_PRINT']),
  body('condition').optional().isIn(['NEW', 'GOOD', 'WORN', 'DAMAGED', 'LOST']),
  body('digitalFileUrl').optional({ values: 'falsy' }).isURL(),
  body('externalLink').optional({ values: 'falsy' }).isURL(),
];

export const listBooksValidator = [
  query('categoryId').optional().isUUID(),
  query('publisherId').optional().isUUID(),
  query('authorId').optional().isUUID(),
  query('status').optional().isIn(['ACTIVE', 'ARCHIVED', 'OUT_OF_PRINT']),
  query('yearFrom').optional().isInt(),
  query('yearTo').optional().isInt(),
  query('search').optional().isString(),
];

export const createBookCopyValidator = [
  body('inventoryNumber').optional().isString(),
  body('condition').optional().isIn(['NEW', 'GOOD', 'WORN', 'DAMAGED', 'LOST']),
  body('location').optional().isString(),
];

export const updateBookCopyValidator = [
  body('condition').optional().isIn(['NEW', 'GOOD', 'WORN', 'DAMAGED', 'LOST']),
  body('location').optional().isString(),
  body('status').optional().isIn(['AVAILABLE', 'BORROWED', 'RESERVED', 'LOST', 'DAMAGED', 'MAINTENANCE', 'WITHDRAWN']),
];
