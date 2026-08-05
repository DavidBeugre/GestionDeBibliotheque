import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadImage } from '../middlewares/upload.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import {
  createBookCopyValidator,
  createBookValidator,
  listBooksValidator,
  updateBookCopyValidator,
  updateBookValidator,
} from '../validators/book.validator';

const router = Router();

/**
 * @openapi
 * /books:
 *   get:
 *     tags: [Livres]
 *     summary: Liste paginée des livres (recherche, filtres, tri)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche plein texte (titre, ISBN, résumé, auteur)
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: publisherId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: authorId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, ARCHIVED, OUT_OF_PRINT] }
 *       - in: query
 *         name: yearFrom
 *         schema: { type: integer }
 *       - in: query
 *         name: yearTo
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Livres]
 *     summary: Créer un livre
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Créé }
 */
router.get('/', paginationValidator, listBooksValidator, validate, BookController.list);

/**
 * @openapi
 * /books/{id}:
 *   get:
 *     tags: [Livres]
 *     summary: Détail d'un livre (auteurs, catégorie, éditeur, exemplaires)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Introuvable }
 */
router.get('/:id', uuidParamValidator('id'), validate, BookController.getById);

router.post('/', authenticate, requirePermission('book:create'), createBookValidator, validate, BookController.create);
router.patch(
  '/:id',
  authenticate,
  requirePermission('book:update'),
  uuidParamValidator('id'),
  updateBookValidator,
  validate,
  BookController.update
);
router.delete(
  '/:id',
  authenticate,
  requirePermission('book:delete'),
  uuidParamValidator('id'),
  validate,
  BookController.remove
);

router.post(
  '/:id/cover',
  authenticate,
  requirePermission('book:update'),
  uuidParamValidator('id'),
  validate,
  uploadImage.single('cover'),
  BookController.uploadCover
);

router.get('/:id/qrcode', uuidParamValidator('id'), validate, BookController.generateQrCode);

// ---------- Exemplaires ----------
router.get('/:id/copies', uuidParamValidator('id'), validate, BookController.listCopies);
router.post(
  '/:id/copies',
  authenticate,
  requirePermission('book:update'),
  uuidParamValidator('id'),
  createBookCopyValidator,
  validate,
  BookController.addCopy
);
router.patch(
  '/:id/copies/:copyId',
  authenticate,
  requirePermission('book:update'),
  uuidParamValidator('id'),
  uuidParamValidator('copyId'),
  updateBookCopyValidator,
  validate,
  BookController.updateCopy
);
router.delete(
  '/:id/copies/:copyId',
  authenticate,
  requirePermission('book:delete'),
  uuidParamValidator('id'),
  uuidParamValidator('copyId'),
  validate,
  BookController.removeCopy
);

export default router;
