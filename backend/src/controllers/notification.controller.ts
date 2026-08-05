import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { NotificationService } from '../services/notification.service';
import { parsePagination } from '../utils/pagination.util';

export const NotificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, ['createdAt']);
    const isRead = req.query.isRead === undefined ? undefined : req.query.isRead === 'true';
    const { items, meta } = await NotificationService.list(req.user!.id, pagination, isRead);
    return ApiResponse.success(res, items, 'Notifications', 200, meta);
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    const count = await NotificationService.unreadCount(req.user!.id);
    return ApiResponse.success(res, { count }, 'Notifications non lues');
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const notification = await NotificationService.markRead(req.params.id, req.user!.id);
    return ApiResponse.success(res, notification, 'Notification marquée comme lue');
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await NotificationService.markAllRead(req.user!.id);
    return ApiResponse.success(res, null, 'Toutes les notifications ont été marquées comme lues');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await NotificationService.remove(req.params.id, req.user!.id);
    return ApiResponse.noContent(res);
  }),
};
