import { query } from 'express-validator';

export const listNotificationsValidator = [query('isRead').optional().isBoolean()];
