import { body } from 'express-validator';

export const createCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Le nom est requis').isLength({ max: 100 }),
  body('description').optional().isString(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Couleur au format hexadécimal (#RRGGBB)'),
  body('icon').optional().isString(),
];

export const updateCategoryValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('description').optional().isString(),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('icon').optional().isString(),
];
