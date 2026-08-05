import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { SettingsService } from '../services/settings.service';

export const SettingsController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    const settings = await SettingsService.getPublic();
    return ApiResponse.success(res, settings, 'Paramètres de la bibliothèque');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const settings = await SettingsService.update(req.body, req.user?.id);
    return ApiResponse.success(res, settings, 'Paramètres mis à jour');
  }),

  updateLogo: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('Aucun fichier reçu (champ "logo" attendu)');
    const settings = await SettingsService.updateLogo(req.file.buffer, req.user?.id, req.file.mimetype);
    return ApiResponse.success(res, settings, 'Logo mis à jour');
  }),
};
