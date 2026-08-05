import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { PublisherService } from '../services/publisher.service';
import { parsePagination } from '../utils/pagination.util';

const SORTABLE_FIELDS = ['name', 'createdAt', 'updatedAt'];

export const PublisherController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, SORTABLE_FIELDS, 'name');
    const { items, meta } = await PublisherService.list(pagination, req.query.search as string | undefined);
    return ApiResponse.success(res, items, 'Liste des éditeurs', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const publisher = await PublisherService.getById(req.params.id);
    return ApiResponse.success(res, publisher, 'Éditeur');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const publisher = await PublisherService.create(req.body);
    return ApiResponse.created(res, publisher, 'Éditeur créé avec succès');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const publisher = await PublisherService.update(req.params.id, req.body);
    return ApiResponse.success(res, publisher, 'Éditeur mis à jour');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await PublisherService.remove(req.params.id);
    return ApiResponse.noContent(res);
  }),
};
