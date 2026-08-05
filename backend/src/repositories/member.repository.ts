import { MemberStatus, Prisma, RoleName } from '@prisma/client';
import { prisma } from '../config/database';

const memberInclude = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      lastLoginAt: true,
    },
  },
} satisfies Prisma.MemberInclude;

export class MemberRepository {
  static async findMany(where: Prisma.MemberWhereInput, skip: number, take: number, sort: string, order: 'asc' | 'desc') {
    const orderBy = ['firstName', 'lastName', 'email'].includes(sort)
      ? { user: { [sort]: order } }
      : { [sort]: order };

    const [items, total] = await Promise.all([
      prisma.member.findMany({ where, skip, take, orderBy, include: memberInclude }),
      prisma.member.count({ where }),
    ]);
    return { items, total };
  }

  static findById(id: string) {
    return prisma.member.findUnique({ where: { id }, include: memberInclude });
  }

  static findByUserId(userId: string) {
    return prisma.member.findUnique({ where: { userId }, include: memberInclude });
  }

  static findByMatricule(matricule: string) {
    return prisma.member.findUnique({ where: { matricule } });
  }

  static findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  }

  static async generateNextMatricule(): Promise<string> {
    const count = await prisma.member.count();
    return `ADH-${String(count + 1).padStart(5, '0')}`;
  }

  static async generateNextCardNumber(): Promise<string> {
    const count = await prisma.member.count();
    return `CARD-${String(count + 1).padStart(5, '0')}`;
  }

  /** Crée en une transaction le compte utilisateur (rôle READER) et le profil adhérent associé. */
  static async createWithUser(data: {
    email: string;
    hashedPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
    matricule: string;
    cardNumber: string;
    sex?: string;
    birthDate?: Date;
    address?: string;
    profession?: string;
    memberType?: string;
    subscriptionExpiry?: Date;
  }) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const role = await tx.role.findUniqueOrThrow({ where: { name: RoleName.READER } });

      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          password: data.hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          roleId: role.id,
          isEmailVerified: true,
        },
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          matricule: data.matricule,
          cardNumber: data.cardNumber,
          sex: data.sex as never,
          birthDate: data.birthDate,
          address: data.address,
          profession: data.profession,
          memberType: data.memberType as never,
          subscriptionExpiry: data.subscriptionExpiry,
        },
        include: memberInclude,
      });

      return member;
    });
  }

  static updateMember(id: string, data: Prisma.MemberUpdateInput) {
    return prisma.member.update({ where: { id }, data, include: memberInclude });
  }

  static updateUser(userId: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id: userId }, data });
  }

  static updateStatus(id: string, status: MemberStatus) {
    return prisma.member.update({ where: { id }, data: { status } });
  }

  /** Supprime l'utilisateur associé : la suppression du Member est en cascade (voir schema.prisma). */
  static deleteViaUser(userId: string) {
    return prisma.user.delete({ where: { id: userId } });
  }

  static countActiveBorrows(memberId: string) {
    return prisma.borrow.count({ where: { memberId, status: { in: ['ONGOING', 'LATE'] } } });
  }

  static countUnpaidFines(memberId: string) {
    return prisma.fine.count({ where: { memberId, status: { in: ['UNPAID', 'PARTIALLY_PAID'] } } });
  }

  static getHistory(memberId: string) {
    return Promise.all([
      prisma.borrow.findMany({
        where: { memberId },
        include: { bookCopy: { include: { book: true } } },
        orderBy: { borrowDate: 'desc' },
        take: 20,
      }),
      prisma.reservation.findMany({
        where: { memberId },
        include: { book: true },
        orderBy: { reservationDate: 'desc' },
        take: 20,
      }),
      prisma.fine.findMany({
        where: { memberId },
        include: { borrow: { include: { bookCopy: { include: { book: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
  }
}
