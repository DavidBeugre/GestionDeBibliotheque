import { Router } from 'express';
import { AuthorController } from '../controllers/author.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadImage } from '../middlewares/upload.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import { createAuthorValidator, updateAuthorValidator } from '../validators/author.validator';

const router = Router();

/**
 * @openapi
 * /authors:
 *   get:
 *     tags: [Auteurs]
 *     summary: Liste paginée des auteurs
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Auteurs]
 *     summary: Créer un auteur
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Créé }
 */
router.get('/', paginationValidator, validate, AuthorController.list);
router.get('/:id', uuidParamValidator('id'), validate, AuthorController.getById);

router.post('/', authenticate, requirePermission('book:create'), createAuthorValidator, validate, AuthorController.create);
router.patch(
  '/:id',
  authenticate,
  requirePermission('book:update'),
  uuidParamValidator('id'),
  updateAuthorValidator,
  validate,
  AuthorController.update
);
router.delete(
  '/:id',
  authenticate,
  requirePermission('book:delete'),
  uuidParamValidator('id'),
  validate,
  AuthorController.remove
);
router.post(
  '/:id/photo',
  authenticate,
  requirePermission('book:update'),
  uuidParamValidator('id'),
  validate,
  uploadImage.single('photo'),
  AuthorController.uploadPhoto
);

export default router;
