import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { AuthorService } from '../services/author.service';
import { parsePagination } from '../utils/pagination.util';

const SORTABLE_FIELDS = ['name', 'nationality', 'createdAt'];

export const AuthorController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, SORTABLE_FIELDS, 'name');
    const { items, meta } = await AuthorService.list(pagination, req.query.search as string | undefined);
    return ApiResponse.success(res, items, 'Liste des auteurs', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const author = await AuthorService.getById(req.params.id);
    return ApiResponse.success(res, author, 'Auteur');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const author = await AuthorService.create(req.body);
    return ApiResponse.created(res, author, 'Auteur créé avec succès');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const author = await AuthorService.update(req.params.id, req.body);
    return ApiResponse.success(res, author, 'Auteur mis à jour');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await AuthorService.remove(req.params.id);
    return ApiResponse.noContent(res);
  }),

  uploadPhoto: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('Aucun fichier reçu (champ "photo" attendu)');
    const author = await AuthorService.updatePhoto(req.params.id, req.file.buffer, req.file.mimetype);
    return ApiResponse.success(res, author, 'Photo mise à jour');
  }),
};
