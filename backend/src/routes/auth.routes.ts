import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  changePasswordValidator,
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  sessionIdParamValidator,
} from '../validators/auth.validator';

const router = Router();

// ---------- Routes publiques ----------
router.post('/register', registerValidator, validate, AuthController.register);
router.post('/login', authRateLimiter, loginValidator, validate, AuthController.login);
router.post('/refresh-token', AuthController.refresh);
router.post('/forgot-password', authRateLimiter, forgotPasswordValidator, validate, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, resetPasswordValidator, validate, AuthController.resetPassword);

// ---------- Routes authentifiées ----------
router.post('/logout', AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/me', authenticate, AuthController.me);
router.post('/change-password', authenticate, changePasswordValidator, validate, AuthController.changePassword);
router.get('/sessions', authenticate, AuthController.listSessions);
router.delete('/sessions/:sessionId', authenticate, sessionIdParamValidator, validate, AuthController.revokeSession);

export default router;
