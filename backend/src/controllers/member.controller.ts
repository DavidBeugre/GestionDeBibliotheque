import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { MemberService } from '../services/member.service';
import { parsePagination } from '../utils/pagination.util';

const SORTABLE_FIELDS = ['matricule', 'registrationDate', 'createdAt', 'firstName', 'lastName', 'email'];

export const MemberController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as never, SORTABLE_FIELDS, 'createdAt');
    const { items, meta } = await MemberService.list(pagination, {
      status: req.query.status as never,
      memberType: req.query.memberType as string | undefined,
      search: req.query.search as string | undefined,
    });
    return ApiResponse.success(res, items, 'Liste des adhérents', 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const member = await MemberService.getById(req.params.id);
    return ApiResponse.success(res, member, 'Adhérent');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const member = await MemberService.create(req.body);
    return ApiResponse.created(res, member, 'Adhérent créé avec succès, un email avec ses identifiants a été envoyé');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const member = await MemberService.update(req.params.id, req.body);
    return ApiResponse.success(res, member, 'Adhérent mis à jour');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await MemberService.remove(req.params.id);
    return ApiResponse.noContent(res);
  }),

  uploadPhoto: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('Aucun fichier reçu (champ "photo" attendu)');
    const member = await MemberService.updatePhoto(req.params.id, req.file.buffer, req.file.mimetype);
    return ApiResponse.success(res, member, 'Photo mise à jour');
  }),

  generateQrCode: asyncHandler(async (req: Request, res: Response) => {
    const qrCodeUrl = await MemberService.generateQrCode(req.params.id);
    return ApiResponse.success(res, { qrCodeUrl }, 'QR Code de la carte adhérent généré');
  }),

  downloadCardPdf: asyncHandler(async (req: Request, res: Response) => {
    const pdf = await MemberService.generateCardPdf(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="shelfly-card-${req.params.id}.pdf"`);
    res.send(pdf);
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const history = await MemberService.getHistory(req.params.id);
    return ApiResponse.success(res, history, "Historique de l'adhérent");
  }),

  suspend: asyncHandler(async (req: Request, res: Response) => {
    await MemberService.suspend(req.params.id);
    return ApiResponse.success(res, null, 'Adhérent suspendu');
  }),

  reactivate: asyncHandler(async (req: Request, res: Response) => {
    await MemberService.reactivate(req.params.id);
    return ApiResponse.success(res, null, 'Adhérent réactivé');
  }),
};
