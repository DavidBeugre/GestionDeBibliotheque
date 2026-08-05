import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { AuditLogService } from '../services/auditLog.service';
import { ActivityService } from '../services/activity.service';
import { parsePagination } from '../utils/pagination.util';

const SORTABLE_FIELDS = ['createdAt', 'action'];

export const AuditLogController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, SORTABLE_FIELDS, 'createdAt');
    const { items, meta } = await AuditLogService.list(pagination, {
      userId: req.query.userId as string | undefined,
      action: req.query.action as never,
      entityType: req.query.entityType as string | undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
    });
    return ApiResponse.success(res, items, "Journal d'audit", 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const log = await AuditLogService.getById(req.params.id);
    return ApiResponse.success(res, log, "Entrée du journal d'audit");
  }),

  recentActivity: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Math.min(50, Number(req.query.limit)) : 20;
    const activity = await ActivityService.list(limit);
    return ApiResponse.success(res, activity, 'Activité récente');
  }),
};
