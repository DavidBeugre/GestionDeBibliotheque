import { Router } from 'express';
import { RoleName } from '@prisma/client';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Statistiques agrégées du tableau de bord (personnel uniquement)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/stats', authenticate, authorize(RoleName.ADMIN, RoleName.LIBRARIAN), DashboardController.getStats);

export default router;
