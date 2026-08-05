import { Request, Response } from 'express';
import { RoleName } from '@prisma/client';
import { authenticate, authorize, requirePermission } from '../auth.middleware';
import { TokenService } from '../../services/token.service';
import { ApiError } from '../../utils/ApiError';

function mockReqRes(headers: Record<string, string> = {}) {
  const req = { headers } as unknown as Request;
  const res = {} as Response;
  const next = jest.fn();
  return { req, res, next };
}

describe('authenticate middleware', () => {
  it("devrait rejeter une requête sans header Authorization", () => {
    const { req, res, next } = mockReqRes();
    authenticate(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next.mock.calls[0][0] as ApiError).statusCode).toBe(401);
  });

  it('devrait rejeter un token malformé', () => {
    const { req, res, next } = mockReqRes({ authorization: 'Bearer token-invalide' });
    authenticate(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it('devrait attacher req.user pour un token valide', () => {
    const token = TokenService.signAccessToken({
      sub: 'u1',
      email: 'a@b.com',
      role: RoleName.LIBRARIAN,
      permissions: ['book:read'],
    });
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(); // appelé sans erreur
    expect(req.user).toEqual({
      id: 'u1',
      email: 'a@b.com',
      role: RoleName.LIBRARIAN,
      permissions: ['book:read'],
    });
  });
});

describe('authorize middleware', () => {
  it('devrait laisser passer un utilisateur avec le bon rôle', () => {
    const { req, res, next } = mockReqRes();
    req.user = { id: 'u1', email: 'a@b.com', role: RoleName.ADMIN, permissions: [] };
    authorize(RoleName.ADMIN)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('devrait bloquer un utilisateur avec un mauvais rôle (403)', () => {
    const { req, res, next } = mockReqRes();
    req.user = { id: 'u1', email: 'a@b.com', role: RoleName.READER, permissions: [] };
    authorize(RoleName.ADMIN)(req, res, next);
    expect((next.mock.calls[0][0] as ApiError).statusCode).toBe(403);
  });
});

describe('requirePermission middleware', () => {
  it('devrait laisser passer si la permission est présente', () => {
    const { req, res, next } = mockReqRes();
    req.user = { id: 'u1', email: 'a@b.com', role: RoleName.LIBRARIAN, permissions: ['book:delete'] };
    requirePermission('book:delete')(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('devrait bloquer si la permission est absente (403)', () => {
    const { req, res, next } = mockReqRes();
    req.user = { id: 'u1', email: 'a@b.com', role: RoleName.READER, permissions: ['book:read'] };
    requirePermission('book:delete')(req, res, next);
    expect((next.mock.calls[0][0] as ApiError).statusCode).toBe(403);
  });
});
