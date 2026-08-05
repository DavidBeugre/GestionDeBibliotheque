import { Router } from 'express';
import { BorrowController } from '../controllers/borrow.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import { createBorrowValidator, listBorrowsValidator } from '../validators/borrow.validator';

const router = Router();

router.use(authenticate, requirePermission('borrow:manage'));

/**
 * @openapi
 * /borrows:
 *   get:
 *     tags: [Emprunts]
 *     summary: Liste paginée des emprunts (filtres memberId, status, overdue)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Emprunts]
 *     summary: Enregistrer un nouvel emprunt
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Créé }
 */
router.get('/', paginationValidator, listBorrowsValidator, validate, BorrowController.list);
router.post('/', createBorrowValidator, validate, BorrowController.create);

router.post('/mark-overdue', BorrowController.markOverdueBatch);

router.get('/:id', uuidParamValidator('id'), validate, BorrowController.getById);
router.post('/:id/return', uuidParamValidator('id'), validate, BorrowController.returnBorrow);
router.post('/:id/renew', uuidParamValidator('id'), validate, BorrowController.renew);
router.post('/:id/lost', uuidParamValidator('id'), validate, BorrowController.markLost);

export default router;
