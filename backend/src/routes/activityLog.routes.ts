import { Router } from 'express';
import { RoleName } from '@prisma/client';
import { AuditLogController } from '../controllers/auditLog.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /activity-logs/recent:
 *   get:
 *     tags: [Audit]
 *     summary: Fil d'activité récente (alimente le dashboard) — visible par tout le personnel
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/recent', authenticate, authorize(RoleName.ADMIN, RoleName.LIBRARIAN), AuditLogController.recentActivity);

export default router;
