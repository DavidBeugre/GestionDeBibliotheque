import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { CategoryService } from '../services/category.service';
import { parsePagination } from '../utils/pagination.util';

const SORTABLE_FIELDS = ['name', 'createdAt', 'updatedAt'];

export const CategoryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, SORTABLE_FIELDS, 'name');
    const { items, meta } = await CategoryService.list(pagination, req.query.search as string | undefined);
    return ApiResponse.success(res, items, 'Liste des catégories', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const category = await CategoryService.getById(req.params.id);
    return ApiResponse.success(res, category, 'Catégorie');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await CategoryService.create(req.body);
    return ApiResponse.created(res, category, 'Catégorie créée avec succès');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const category = await CategoryService.update(req.params.id, req.body);
    return ApiResponse.success(res, category, 'Catégorie mise à jour');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await CategoryService.remove(req.params.id);
    return ApiResponse.noContent(res);
  }),
};
