import { query } from 'express-validator';

const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'FAILED_LOGIN',
  'CREATE',
  'UPDATE',
  'DELETE',
  'EXPORT',
  'IMPORT',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET',
];

export const listAuditLogsValidator = [
  query('userId').optional().isUUID(),
  query('action').optional().isIn(AUDIT_ACTIONS),
  query('entityType').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
];
