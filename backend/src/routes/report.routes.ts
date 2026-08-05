import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, requirePermission('report:view'));

/**
 * @openapi
 * /reports/{type}:
 *   get:
 *     tags: [Rapports]
 *     summary: Données d'un rapport (popular-books, never-borrowed, overdue, fines, active-members, daily-activity, annual-stats)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/:type', ReportController.get);

/**
 * @openapi
 * /reports/{type}/export:
 *   get:
 *     tags: [Rapports]
 *     summary: Export du rapport (format=csv|excel|pdf)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Fichier généré }
 */
router.get('/:type/export', ReportController.export);

export default router;
