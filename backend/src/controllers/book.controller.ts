import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { BookService } from '../services/book.service';
import { parsePagination } from '../utils/pagination.util';
import { BookFilters } from '../utils/bookQuery.util';

const SORTABLE_FIELDS = ['title', 'year', 'createdAt', 'updatedAt', 'availableCopies'];

export const BookController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, SORTABLE_FIELDS, 'createdAt');
    const filters: BookFilters = {
      search: req.query.search as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      publisherId: req.query.publisherId as string | undefined,
      authorId: req.query.authorId as string | undefined,
      status: req.query.status as never,
      language: req.query.language as string | undefined,
      yearFrom: req.query.yearFrom ? Number(req.query.yearFrom) : undefined,
      yearTo: req.query.yearTo ? Number(req.query.yearTo) : undefined,
      tag: req.query.tag as string | undefined,
    };
    const { items, meta } = await BookService.list(pagination, filters);
    return ApiResponse.success(res, items, 'Liste des livres', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const book = await BookService.getById(req.params.id);
    return ApiResponse.success(res, book, 'Livre');
  }),

  recommendations: asyncHandler(async (req: Request, res: Response) => {
    const books = await BookService.recommendations(req.params.id);
    return ApiResponse.success(res, books, 'Recommandations');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const book = await BookService.create(req.body);
    return ApiResponse.created(res, book, 'Livre créé avec succès');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const book = await BookService.update(req.params.id, req.body);
    return ApiResponse.success(res, book, 'Livre mis à jour');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await BookService.remove(req.params.id);
    return ApiResponse.success(res, null, 'Livre archivé avec succès');
  }),

  uploadCover: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('Aucun fichier reçu (champ "cover" attendu)');
    const book = await BookService.updateCover(req.params.id, req.file.buffer, req.file.mimetype);
    return ApiResponse.success(res, book, 'Couverture mise à jour');
  }),

  generateQrCode: asyncHandler(async (req: Request, res: Response) => {
    const qrCodeUrl = await BookService.generateQrCode(req.params.id);
    return ApiResponse.success(res, { qrCodeUrl }, 'QR Code généré');
  }),

  // ---------- Exemplaires ----------

  listCopies: asyncHandler(async (req: Request, res: Response) => {
    const copies = await BookService.listCopies(req.params.id);
    return ApiResponse.success(res, copies, 'Exemplaires du livre');
  }),

  addCopy: asyncHandler(async (req: Request, res: Response) => {
    const copy = await BookService.addCopy(req.params.id, req.body);
    return ApiResponse.created(res, copy, 'Exemplaire ajouté avec succès');
  }),

  updateCopy: asyncHandler(async (req: Request, res: Response) => {
    const copy = await BookService.updateCopy(req.params.id, req.params.copyId, req.body);
    return ApiResponse.success(res, copy, 'Exemplaire mis à jour');
  }),

  removeCopy: asyncHandler(async (req: Request, res: Response) => {
    await BookService.removeCopy(req.params.id, req.params.copyId);
    return ApiResponse.noContent(res);
  }),
};
