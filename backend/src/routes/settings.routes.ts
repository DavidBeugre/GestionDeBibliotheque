import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadImage } from '../middlewares/upload.middleware';
import { updateSettingsValidator } from '../validators/settings.validator';

const router = Router();

/**
 * @openapi
 * /settings:
 *   get:
 *     tags: [Paramètres]
 *     summary: Paramètres publics de la bibliothèque (nom, logo, coordonnées...)
 *     responses:
 *       200: { description: OK }
 *   patch:
 *     tags: [Paramètres]
 *     summary: Met à jour les paramètres (réservé aux administrateurs)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/', SettingsController.get);
router.patch('/', authenticate, requirePermission('settings:manage'), updateSettingsValidator, validate, SettingsController.update);
router.post(
  '/logo',
  authenticate,
  requirePermission('settings:manage'),
  uploadImage.single('logo'),
  SettingsController.updateLogo
);

export default router;
