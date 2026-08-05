import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { DashboardService } from '../services/dashboard.service';

export const DashboardController = {
  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await DashboardService.getStats();
    return ApiResponse.success(res, stats, 'Statistiques du tableau de bord');
  }),
};
