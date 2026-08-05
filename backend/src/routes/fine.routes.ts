import { Router } from 'express';
import { FineController, PaymentController } from '../controllers/fine.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import { createPaymentValidator, listFinesValidator, listPaymentsValidator, waiveFineValidator } from '../validators/fine.validator';

const fineRouter = Router();
fineRouter.use(authenticate, requirePermission('fine:manage'));

/**
 * @openapi
 * /fines:
 *   get:
 *     tags: [Amendes]
 *     summary: Liste paginée des amendes
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
fineRouter.get('/', paginationValidator, listFinesValidator, validate, FineController.list);
fineRouter.get('/:id', uuidParamValidator('id'), validate, FineController.getById);
fineRouter.post('/:id/waive', uuidParamValidator('id'), waiveFineValidator, validate, FineController.waive);

const paymentRouter = Router();
paymentRouter.use(authenticate, requirePermission('fine:manage'));

/**
 * @openapi
 * /payments:
 *   get:
 *     tags: [Paiements]
 *     summary: Liste paginée des paiements
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Paiements]
 *     summary: Encaisser le paiement d'une amende (total ou partiel)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Créé }
 */
paymentRouter.get('/', paginationValidator, listPaymentsValidator, validate, PaymentController.list);
paymentRouter.post('/', createPaymentValidator, validate, PaymentController.create);
paymentRouter.get('/:id', uuidParamValidator('id'), validate, PaymentController.getById);

export { fineRouter, paymentRouter };
