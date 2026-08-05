import { Router } from 'express';
import { PublisherController } from '../controllers/publisher.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import { createPublisherValidator, updatePublisherValidator } from '../validators/publisher.validator';

const router = Router();

/**
 * @openapi
 * /publishers:
 *   get:
 *     tags: [Éditeurs]
 *     summary: Liste paginée des éditeurs
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Éditeurs]
 *     summary: Créer un éditeur
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Créé }
 */
router.get('/', paginationValidator, validate, PublisherController.list);
router.get('/:id', uuidParamValidator('id'), validate, PublisherController.getById);

router.post(
  '/',
  authenticate,
  requirePermission('book:create'),
  createPublisherValidator,
  validate,
  PublisherController.create
);
router.patch(
  '/:id',
  authenticate,
  requirePermission('book:update'),
  uuidParamValidator('id'),
  updatePublisherValidator,
  validate,
  PublisherController.update
);
router.delete(
  '/:id',
  authenticate,
  requirePermission('book:delete'),
  uuidParamValidator('id'),
  validate,
  PublisherController.remove
);

export default router;
