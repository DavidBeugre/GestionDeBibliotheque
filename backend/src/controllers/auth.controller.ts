import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { AuthService } from '../services/auth.service';
import { env } from '../config/env';

const REFRESH_COOKIE_NAME = 'refreshToken';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict' as const,
    path: `${env.apiPrefix}/auth`, // le cookie n'est envoyé qu'aux routes d'auth
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function requestMeta(req: Request) {
  return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
}

function setRefreshCookieAndRespond(res: Response, result: { user: unknown; accessToken: string; refreshToken: string }, message: string, statusCode = 200) {
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());
  return ApiResponse.success(res, { user: result.user, accessToken: result.accessToken }, message, statusCode);
}

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    return setRefreshCookieAndRespond(res, result, 'Compte créé avec succès', 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body, requestMeta(req));
    return setRefreshCookieAndRespond(res, result, 'Connexion réussie');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) throw ApiError.unauthorized('Aucune session active');

    const result = await AuthService.refresh(rawToken, requestMeta(req));
    return setRefreshCookieAndRespond(res, result, 'Session renouvelée');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) await AuthService.logout(rawToken);
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    return ApiResponse.success(res, null, 'Déconnexion réussie');
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.logoutAll(req.user!.id);
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    return ApiResponse.success(res, null, 'Déconnecté de toutes les sessions');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    return ApiResponse.success(res, req.user, 'Utilisateur courant');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.forgotPassword(req.body.email);
    return ApiResponse.success(res, null, 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé');
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.resetPassword(req.body.token, req.body.newPassword);
    return ApiResponse.success(res, null, 'Mot de passe réinitialisé avec succès');
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.changePassword(req.user!.id, req.body.oldPassword, req.body.newPassword);
    return ApiResponse.success(res, null, 'Mot de passe modifié avec succès');
  }),

  listSessions: asyncHandler(async (req: Request, res: Response) => {
    const sessions = await AuthService.getActiveSessions(req.user!.id);
    return ApiResponse.success(res, sessions, 'Sessions actives');
  }),

  revokeSession: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.revokeSession(req.user!.id, req.params.sessionId);
    return ApiResponse.success(res, null, 'Session révoquée');
  }),
};
