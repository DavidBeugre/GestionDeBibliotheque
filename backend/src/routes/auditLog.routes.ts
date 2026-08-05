import { Router } from 'express';
import { RoleName } from '@prisma/client';
import { AuditLogController } from '../controllers/auditLog.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import { listAuditLogsValidator } from '../validators/auditLog.validator';

const router = Router();

/**
 * @openapi
 * /audit-logs:
 *   get:
 *     tags: [Audit]
 *     summary: Journal d'audit (réservé aux administrateurs)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       403: { description: Réservé aux administrateurs }
 */
router.get('/', authenticate, authorize(RoleName.ADMIN), paginationValidator, listAuditLogsValidator, validate, AuditLogController.list);
router.get('/:id', authenticate, authorize(RoleName.ADMIN), uuidParamValidator('id'), validate, AuditLogController.getById);

export default router;
