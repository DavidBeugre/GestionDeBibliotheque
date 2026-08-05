import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import { listNotificationsValidator } from '../validators/notification.validator';

const router = Router();

// Notifications = données personnelles à l'utilisateur connecté uniquement (pas de permission
// spécifique nécessaire : chaque utilisateur ne voit que les siennes, contrôlé au niveau service).
router.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Liste paginée des notifications de l'utilisateur connecté
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/', paginationValidator, listNotificationsValidator, validate, NotificationController.list);
router.get('/unread-count', NotificationController.unreadCount);
router.patch('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', uuidParamValidator('id'), validate, NotificationController.markRead);
router.delete('/:id', uuidParamValidator('id'), validate, NotificationController.remove);

export default router;
