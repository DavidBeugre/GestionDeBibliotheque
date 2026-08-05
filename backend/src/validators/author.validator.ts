import { body } from 'express-validator';

export const createAuthorValidator = [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('nationality').optional().isString(),
  body('birthDate').optional().isISO8601().withMessage('Date de naissance invalide'),
  body('deathDate').optional().isISO8601().withMessage('Date de décès invalide'),
  body('biography').optional().isString(),
  body('website').optional().isURL().withMessage('URL invalide'),
];

export const updateAuthorValidator = [
  body('name').optional().trim().notEmpty(),
  body('nationality').optional().isString(),
  body('birthDate').optional().isISO8601(),
  body('deathDate').optional().isISO8601(),
  body('biography').optional().isString(),
  body('website').optional().isURL(),
];
