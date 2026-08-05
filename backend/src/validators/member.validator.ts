import { body, query } from 'express-validator';

const MEMBER_TYPES = ['STUDENT', 'TEACHER', 'STAFF', 'EXTERNAL', 'VIP'];
const MEMBER_STATUSES = ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'BLOCKED'];

export const createMemberValidator = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').optional().isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis'),
  body('phone').optional().isString(),
  body('sex').optional().isIn(['MALE', 'FEMALE', 'OTHER']),
  body('birthDate').optional().isISO8601().withMessage('Date de naissance invalide'),
  body('address').optional().isString(),
  body('profession').optional().isString(),
  body('memberType').optional().isIn(MEMBER_TYPES),
  body('subscriptionExpiry').optional().isISO8601().withMessage("Date d'expiration invalide"),
];

export const updateMemberValidator = [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().isString(),
  body('sex').optional().isIn(['MALE', 'FEMALE', 'OTHER']),
  body('birthDate').optional().isISO8601(),
  body('address').optional().isString(),
  body('profession').optional().isString(),
  body('memberType').optional().isIn(MEMBER_TYPES),
  body('subscriptionExpiry').optional().isISO8601(),
  body('status').optional().isIn(MEMBER_STATUSES),
];

export const listMembersValidator = [
  query('status').optional().isIn(MEMBER_STATUSES),
  query('memberType').optional().isIn(MEMBER_TYPES),
  query('search').optional().isString(),
];
