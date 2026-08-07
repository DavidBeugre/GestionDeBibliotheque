import { prisma } from '../config/database';
import { RoleName } from '@prisma/client';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export class UserRepository {
  static findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: { include: { permissions: true } }, member: true },
    });
  }

  static findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: true } }, member: true },
    });
  }

  static async findByIdOrThrow(id: string) {
    const user = await this.findById(id);
    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    return user;
  }

  static async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleName?: RoleName;
  }) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: data.roleName ?? RoleName.READER },
    });

    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: role.id,
      },
      include: { role: { include: { permissions: true } }, member: true },
    });
  }

  static registerFailedLogin(userId: string, currentFailedCount: number) {
    const willLock = currentFailedCount + 1 >= env.security.maxLoginAttempts;
    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: { increment: 1 },
        ...(willLock
          ? { lockedUntil: new Date(Date.now() + env.security.lockTimeMinutes * 60 * 1000) }
          : {}),
      },
    });
  }

  static resetFailedLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
  }

  static updatePassword(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  static updateProfile(userId: string, data: { firstName: string; lastName: string; email: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: { ...data, email: data.email.toLowerCase().trim() },
      include: { role: { include: { permissions: true } }, member: true },
    });
  }

  static setResetToken(userId: string, hashedToken: string, expiresAt: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: { resetPasswordToken: hashedToken, resetPasswordExpires: expiresAt },
    });
  }

  static findByResetToken(hashedToken: string) {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });
  }
}
