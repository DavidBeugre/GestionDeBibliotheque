import { Router } from 'express';
import { authorize, authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { paginationValidator, uuidParamValidator } from '../validators/common.validator';
import { body, query } from 'express-validator';
import { UserController } from '../controllers/user.controller';

const router = Router();
router.use(authenticate, authorize('ADMIN'));
router.get('/', paginationValidator, query('search').optional().isString(), query('role').optional().isIn(['ADMIN', 'LIBRARIAN', 'READER']), validate, UserController.list);
router.patch('/:id', uuidParamValidator('id'), body('role').optional().isIn(['ADMIN', 'LIBRARIAN', 'READER']), body('isActive').optional().isBoolean(), validate, UserController.update);
export default router;
