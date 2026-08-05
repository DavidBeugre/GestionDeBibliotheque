import { body } from 'express-validator';

export const createPublisherValidator = [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('address').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('country').optional().isString(),
  body('website').optional().isURL().withMessage('URL invalide'),
];

export const updatePublisherValidator = [
  body('name').optional().trim().notEmpty(),
  body('address').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isEmail(),
  body('country').optional().isString(),
  body('website').optional().isURL(),
];
