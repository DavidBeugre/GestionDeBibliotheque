import { AuditAction, RoleName } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { comparePassword, hashPassword, isStrongPassword } from '../utils/password.util';
import { generateOpaqueToken, hashToken } from '../utils/crypto.util';
import { UserRepository } from '../repositories/user.repository';
import { MemberRepository } from '../repositories/member.repository';
import { ReservationService } from './reservation.service';
import { generateQrCodeBuffer } from '../utils/qrcode.util';
import { uploadBufferToCloudinary } from '../utils/cloudinary.util';
import { SessionRepository } from '../repositories/session.repository';
import { TokenService, AccessTokenPayload } from './token.service';
import { EmailService } from './email.service';
import { AuditService } from './audit.service';
import { env } from '../config/env';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: RoleName;
    permissions: string[];
  };
  accessToken: string;
  refreshToken: string;
}

function toPublicUser(user: NonNullable<Awaited<ReturnType<typeof UserRepository.findByEmail>>>) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    role: user.role.name,
    permissions: user.role.permissions.map((p: { code: string }) => p.code),
  };
}

export class AuthService {
  static async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResult> {
    const existing = await UserRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('Un compte existe déjà avec cet email');
    }

    if (!isStrongPassword(input.password)) {
      throw ApiError.badRequest(
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
      );
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await UserRepository.create({
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      roleName: RoleName.READER,
    });

    await EmailService.sendWelcomeEmail(user.email, user.firstName);
    await AuditService.record(AuditAction.CREATE, { userId: user.id, entityType: 'User', entityId: user.id });

    return this.issueTokens(await UserRepository.findByIdOrThrow(user.id), {});
  }

  static async login(
    input: { email: string; password: string },
    meta: RequestMeta
  ): Promise<AuthResult> {
    const user = await UserRepository.findByEmail(input.email);

    if (!user) {
      // Ne jamais préciser si c'est l'email ou le mot de passe qui est incorrect (anti-énumération)
      throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw ApiError.locked();
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Ce compte a été désactivé');
    }

    const isPasswordValid = await comparePassword(input.password, user.password);

    if (!isPasswordValid) {
      const updated = await UserRepository.registerFailedLogin(user.id, user.failedLoginCount);
      await AuditService.record(AuditAction.FAILED_LOGIN, {
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      if (updated.lockedUntil) {
        await EmailService.sendAccountLockedEmail(user.email);
        throw ApiError.locked();
      }
      throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    await UserRepository.resetFailedLogin(user.id);
    await AuditService.record(AuditAction.LOGIN, {
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return this.issueTokens(user, meta);
  }

  static async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<AuthResult> {
    const hashed = hashToken(rawRefreshToken);
    const session = await SessionRepository.findByHashedToken(hashed);

    if (!session) {
      throw ApiError.unauthorized('Session invalide, veuillez vous reconnecter');
    }

    if (session.isRevoked) {
      // Un refresh token déjà utilisé/révoqué qui ressert est un signal fort de vol de token :
      // on révoque toutes les sessions de l'utilisateur par précaution.
      await SessionRepository.revokeAllForUser(session.userId);
      throw ApiError.unauthorized('Session invalide, veuillez vous reconnecter');
    }

    if (session.expiresAt < new Date()) {
      throw ApiError.unauthorized('Session expirée, veuillez vous reconnecter');
    }

    // Rotation : l'ancien refresh token est immédiatement révoqué.
    await SessionRepository.revoke(session.id);

    const user = await UserRepository.findByIdOrThrow(session.userId);
    return this.issueTokens(user, meta);
  }

  static async logout(rawRefreshToken: string): Promise<void> {
    const hashed = hashToken(rawRefreshToken);
    const session = await SessionRepository.findByHashedToken(hashed);
    if (session) {
      await SessionRepository.revoke(session.id);
      await AuditService.record(AuditAction.LOGOUT, { userId: session.userId });
    }
  }

  static async logoutAll(userId: string): Promise<void> {
    await SessionRepository.revokeAllForUser(userId);
    await AuditService.record(AuditAction.LOGOUT, { userId });
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    // Réponse identique que l'utilisateur existe ou non (anti-énumération d'emails)
    if (!user) return;

    const rawToken = generateOpaqueToken();
    const hashed = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await UserRepository.setResetToken(user.id, hashed, expiresAt);

    const resetUrl = `${env.frontendUrl}/reset-password?token=${rawToken}`;
    await EmailService.sendPasswordResetEmail(user.email, resetUrl);
    await AuditService.record(AuditAction.PASSWORD_RESET, { userId: user.id });
  }

  static async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    if (!isStrongPassword(newPassword)) {
      throw ApiError.badRequest(
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
      );
    }

    const hashed = hashToken(rawToken);
    const user = await UserRepository.findByResetToken(hashed);
    if (!user) {
      throw ApiError.badRequest('Le lien de réinitialisation est invalide ou a expiré');
    }

    const hashedPassword = await hashPassword(newPassword);
    await UserRepository.updatePassword(user.id, hashedPassword);
    await SessionRepository.revokeAllForUser(user.id); // déconnecte toutes les sessions actives
    await AuditService.record(AuditAction.PASSWORD_RESET, { userId: user.id });
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await UserRepository.findByIdOrThrow(userId);

    const isValid = await comparePassword(oldPassword, user.password);
    if (!isValid) {
      throw ApiError.unauthorized('Mot de passe actuel incorrect');
    }

    if (!isStrongPassword(newPassword)) {
      throw ApiError.badRequest(
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    await UserRepository.updatePassword(userId, hashedPassword);
    await SessionRepository.revokeAllForUser(userId);
    await AuditService.record(AuditAction.PASSWORD_CHANGE, { userId });
  }

  static async updateProfile(userId: string, input: { firstName: string; lastName: string; email: string }) {
    const normalizedEmail = input.email.toLowerCase().trim();
    const currentUser = await UserRepository.findByIdOrThrow(userId);
    if (normalizedEmail !== currentUser.email) {
      const existingUser = await UserRepository.findByEmail(normalizedEmail);
      if (existingUser) throw ApiError.conflict('Un compte existe déjà avec cet email');
    }

    const user = await UserRepository.updateProfile(userId, {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: normalizedEmail,
    });
    return toPublicUser(user);
  }

  static async getMemberPortal(userId: string) {
    const member = await MemberRepository.findPortalByUserId(userId);
    if (!member) throw ApiError.notFound('Aucun profil adhérent associé à ce compte');
    return member;
  }

  static async createOwnReservation(userId: string, bookId: string) {
    const member = await MemberRepository.findByUserId(userId);
    if (!member) throw ApiError.notFound('Aucun profil adhérent associé à ce compte');
    return ReservationService.create(member.id, bookId);
  }

  static async cancelOwnReservation(userId: string, reservationId: string): Promise<void> {
    const member = await MemberRepository.findByUserId(userId);
    const reservation = await ReservationService.getById(reservationId);
    if (!member || reservation.memberId !== member.id) throw ApiError.forbidden('Cette réservation ne vous appartient pas');
    await ReservationService.cancel(reservationId);
  }

  static async generateOwnMemberQrCode(userId: string): Promise<string> {
    const member = await MemberRepository.findByUserId(userId);
    if (!member) throw ApiError.notFound('Aucun profil adhérent associé à ce compte');
    if (member.qrCode) return member.qrCode;

    const payload = JSON.stringify({ type: 'member', id: member.id, matricule: member.matricule });
    const buffer = await generateQrCodeBuffer(payload);
    const { url } = await uploadBufferToCloudinary(buffer, 'members/qrcodes');
    await MemberRepository.updateMember(member.id, { qrCode: url });
    return url;
  }

  static getActiveSessions(userId: string) {
    return SessionRepository.listActiveForUser(userId);
  }

  static async revokeSession(userId: string, sessionId: string): Promise<void> {
    const sessions = await SessionRepository.listActiveForUser(userId);
    const target = sessions.find((s: { id: string }) => s.id === sessionId);
    if (!target) throw ApiError.notFound('Session introuvable');
    await SessionRepository.revoke(sessionId);
  }

  // --------------------------------------------------------------------
  private static async issueTokens(
    user: NonNullable<Awaited<ReturnType<typeof UserRepository.findByEmail>>>,
    meta: RequestMeta
  ): Promise<AuthResult> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions.map((p: { code: string }) => p.code),
    };

    const accessToken = TokenService.signAccessToken(payload);
    const { raw: refreshToken, hashed } = TokenService.generateRefreshToken();

    await SessionRepository.create({
      userId: user.id,
      hashedRefreshToken: hashed,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { user: toPublicUser(user), accessToken, refreshToken };
  }
}
