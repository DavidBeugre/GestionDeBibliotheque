import { Prisma, RoleName } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';

const select = { id: true, email: true, firstName: true, lastName: true, isActive: true, lastLoginAt: true, createdAt: true, role: { select: { name: true } } } satisfies Prisma.UserSelect;

export class UserService {
  static async list(pagination: PaginationParams, search?: string, role?: RoleName) {
    const where: Prisma.UserWhereInput = {
      ...(role ? { role: { name: role } } : {}),
      ...(search?.trim() ? { OR: [{ email: { contains: search.trim(), mode: 'insensitive' } }, { firstName: { contains: search.trim(), mode: 'insensitive' } }, { lastName: { contains: search.trim(), mode: 'insensitive' } }] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, skip: pagination.skip, take: pagination.limit, orderBy: { createdAt: 'desc' }, select }),
      prisma.user.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async update(id: string, actorId: string, input: { role?: RoleName; isActive?: boolean }) {
    if (id === actorId && (input.role || input.isActive === false)) throw ApiError.badRequest('Vous ne pouvez pas modifier vos propres droits ou désactiver votre compte');
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    const role = input.role ? await prisma.role.findUnique({ where: { name: input.role } }) : null;
    if (input.role && !role) throw ApiError.badRequest('Rôle introuvable');
    return prisma.user.update({ where: { id }, data: { ...(role ? { roleId: role.id } : {}), ...(input.isActive !== undefined ? { isActive: input.isActive } : {}) }, select });
  }
}
