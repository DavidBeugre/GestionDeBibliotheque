import { body, param } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token requis'),
  body('newPassword').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
];

export const changePasswordValidator = [
  body('oldPassword').notEmpty().withMessage('Le mot de passe actuel est requis'),
  body('newPassword').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères'),
];

export const updateProfileValidator = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis'),
];

export const sessionIdParamValidator = [param('sessionId').isUUID().withMessage('Identifiant de session invalide')];
