import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import { createReservationValidator, listReservationsValidator } from '../validators/reservation.validator';

const router = Router();

router.use(authenticate, requirePermission('borrow:manage'));

/**
 * @openapi
 * /reservations:
 *   get:
 *     tags: [Réservations]
 *     summary: Liste paginée des réservations
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Réservations]
 *     summary: Créer une réservation
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Créé }
 */
router.get('/', paginationValidator, listReservationsValidator, validate, ReservationController.list);
router.post('/', createReservationValidator, validate, ReservationController.create);

router.post('/expire-overdue', ReservationController.expireOverdueBatch);

router.get('/:id', uuidParamValidator('id'), validate, ReservationController.getById);
router.post('/:id/cancel', uuidParamValidator('id'), validate, ReservationController.cancel);
router.post('/:id/fulfill', uuidParamValidator('id'), validate, ReservationController.fulfill);

export default router;
