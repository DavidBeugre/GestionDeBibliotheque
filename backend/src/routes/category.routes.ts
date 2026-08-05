import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import { createCategoryValidator, updateCategoryValidator } from '../validators/category.validator';

const router = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Catégories]
 *     summary: Liste paginée des catégories
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Catégories]
 *     summary: Créer une catégorie
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Créé }
 */
router.get('/', paginationValidator, validate, CategoryController.list);
router.get('/:id', uuidParamValidator('id'), validate, CategoryController.getById);

router.post(
  '/',
  authenticate,
  requirePermission('book:create'),
  createCategoryValidator,
  validate,
  CategoryController.create
);
router.patch(
  '/:id',
  authenticate,
  requirePermission('book:update'),
  uuidParamValidator('id'),
  updateCategoryValidator,
  validate,
  CategoryController.update
);
router.delete(
  '/:id',
  authenticate,
  requirePermission('book:delete'),
  uuidParamValidator('id'),
  validate,
  CategoryController.remove
);

export default router;
