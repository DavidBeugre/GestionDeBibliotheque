import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { parsePagination } from '../utils/pagination.util';
import { UserService } from '../services/user.service';

export const UserController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.list(parsePagination(req.query as never, ['createdAt'], 'createdAt'), req.query.search as string | undefined, req.query.role as never);
    return ApiResponse.success(res, result.items, 'Liste des utilisateurs', 200, result.meta);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.update(req.params.id, req.user!.id, req.body);
    return ApiResponse.success(res, user, 'Utilisateur mis à jour');
  }),
};
