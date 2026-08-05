import { param, query } from 'express-validator';

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page doit être un entier >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit doit être compris entre 1 et 100'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order doit être "asc" ou "desc"'),
];

export const uuidParamValidator = (name: string) => [
  param(name).isUUID().withMessage(`${name} doit être un UUID valide`),
];
