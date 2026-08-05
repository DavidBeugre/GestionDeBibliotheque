import { Router } from 'express';
import { MemberController } from '../controllers/member.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadImage } from '../middlewares/upload.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import { createMemberValidator, listMembersValidator, updateMemberValidator } from '../validators/member.validator';

const router = Router();

// L'ensemble du module Adhérents est réservé au personnel de la bibliothèque
// (données personnelles sensibles) : authentification + permission member:manage.
router.use(authenticate, requirePermission('member:manage'));

/**
 * @openapi
 * /members:
 *   get:
 *     tags: [Adhérents]
 *     summary: Liste paginée des adhérents (recherche, filtres)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Adhérents]
 *     summary: Créer un adhérent (crée le compte utilisateur + le profil adhérent)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Créé }
 */
router.get('/', paginationValidator, listMembersValidator, validate, MemberController.list);
router.post('/', createMemberValidator, validate, MemberController.create);

router.get('/:id', uuidParamValidator('id'), validate, MemberController.getById);
router.patch('/:id', uuidParamValidator('id'), updateMemberValidator, validate, MemberController.update);
router.delete('/:id', uuidParamValidator('id'), validate, MemberController.remove);

router.get('/:id/history', uuidParamValidator('id'), validate, MemberController.history);
router.get('/:id/qrcode', uuidParamValidator('id'), validate, MemberController.generateQrCode);
router.post('/:id/photo', uuidParamValidator('id'), validate, uploadImage.single('photo'), MemberController.uploadPhoto);

router.post('/:id/suspend', uuidParamValidator('id'), validate, MemberController.suspend);
router.post('/:id/reactivate', uuidParamValidator('id'), validate, MemberController.reactivate);

export default router;
