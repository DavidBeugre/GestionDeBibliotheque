import { Router } from 'express';
import authRoutes from './auth.routes';
import bookRoutes from './book.routes';
import authorRoutes from './author.routes';
import publisherRoutes from './publisher.routes';
import categoryRoutes from './category.routes';
import memberRoutes from './member.routes';
import borrowRoutes from './borrow.routes';
import reservationRoutes from './reservation.routes';
import { fineRouter, paymentRouter } from './fine.routes';
import notificationRoutes from './notification.routes';
import auditLogRoutes from './auditLog.routes';
import activityLogRoutes from './activityLog.routes';
import settingsRoutes from './settings.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/authors', authorRoutes);
router.use('/publishers', publisherRoutes);
router.use('/categories', categoryRoutes);
router.use('/members', memberRoutes);
router.use('/borrows', borrowRoutes);
router.use('/reservations', reservationRoutes);
router.use('/fines', fineRouter);
router.use('/payments', paymentRouter);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

export default router;
