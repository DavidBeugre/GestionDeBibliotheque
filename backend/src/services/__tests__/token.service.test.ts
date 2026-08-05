import { RoleName } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { TokenService } from '../token.service';
import { ApiError } from '../../utils/ApiError';

describe('TokenService', () => {
  const payload = {
    sub: 'user-id-123',
    email: 'test@library.com',
    role: RoleName.READER,
    permissions: ['book:read'],
  };

  describe('access token', () => {
    it('devrait signer puis vérifier un access token valide', () => {
      const token = TokenService.signAccessToken(payload);
      const decoded = TokenService.verifyAccessToken(token);

      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.permissions).toEqual(payload.permissions);
    });

    it('devrait rejeter un token invalide', () => {
      expect(() => TokenService.verifyAccessToken('token.invalide.xyz')).toThrow(ApiError);
    });

    it('devrait rejeter un token signé avec un mauvais secret', () => {
      const fakeToken = jwt.sign(payload, 'mauvais-secret');
      expect(() => TokenService.verifyAccessToken(fakeToken)).toThrow(ApiError);
    });
  });

  describe('refresh token', () => {
    it('devrait générer un refresh token opaque avec son empreinte hashée', () => {
      const { raw, hashed } = TokenService.generateRefreshToken();
      expect(raw).not.toBe(hashed);
      expect(TokenService.hashRefreshToken(raw)).toBe(hashed);
    });

    it('devrait générer un refresh token différent à chaque appel', () => {
      const a = TokenService.generateRefreshToken();
      const b = TokenService.generateRefreshToken();
      expect(a.raw).not.toBe(b.raw);
    });
  });
});
