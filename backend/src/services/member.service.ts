import { MemberStatus } from '@prisma/client';
import { MemberRepository } from '../repositories/member.repository';
import { ApiError } from '../utils/ApiError';
import { hashPassword, generateTemporaryPassword } from '../utils/password.util';
import { uploadBufferToCloudinary } from '../utils/cloudinary.util';
import { generateQrCodeBuffer } from '../utils/qrcode.util';
import { EmailService } from './email.service';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';
import { createMemberCardPdf } from '../utils/memberCardPdf.util';

interface CreateMemberInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  sex?: string;
  birthDate?: string;
  address?: string;
  profession?: string;
  memberType?: string;
  subscriptionExpiry?: string;
}

interface MemberFilters {
  status?: MemberStatus;
  memberType?: string;
  search?: string;
}

export class MemberService {
  static async list(pagination: PaginationParams, filters: MemberFilters) {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.memberType) where.memberType = filters.memberType;
    if (filters.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { matricule: { contains: search, mode: 'insensitive' } },
        { cardNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const { items, total } = await MemberRepository.findMany(
      where as never,
      pagination.skip,
      pagination.limit,
      pagination.sort,
      pagination.order
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async getById(id: string) {
    const member = await MemberRepository.findById(id);
    if (!member) throw ApiError.notFound('Adhérent introuvable');
    return member;
  }

  static async create(input: CreateMemberInput) {
    const existingUser = await MemberRepository.findByEmail(input.email);
    if (existingUser) throw ApiError.conflict('Un compte existe déjà avec cet email');

    const temporaryPassword = input.password ?? generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    const [matricule, cardNumber] = await Promise.all([
      MemberRepository.generateNextMatricule(),
      MemberRepository.generateNextCardNumber(),
    ]);

    const member = await MemberRepository.createWithUser({
      email: input.email,
      hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      matricule,
      cardNumber,
      sex: input.sex,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      address: input.address,
      profession: input.profession,
      memberType: input.memberType,
      subscriptionExpiry: input.subscriptionExpiry ? new Date(input.subscriptionExpiry) : undefined,
    });

    await EmailService.sendMemberWelcomeEmail(input.email, input.firstName, matricule, temporaryPassword);
    await AuditService.record(AuditAction.CREATE, { entityType: 'Member', entityId: member.id });

    return member;
  }

  static async update(
    id: string,
    input: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      sex: string;
      birthDate: string;
      address: string;
      profession: string;
      memberType: string;
      subscriptionExpiry: string;
      status: MemberStatus;
    }>
  ) {
    const member = await this.getById(id);

    const { firstName, lastName, email, phone, ...memberFields } = input;

    if (firstName || lastName || email || phone) {
      await MemberRepository.updateUser(member.userId, {
        firstName,
        lastName,
        phone,
        ...(email ? { email: email.toLowerCase().trim() } : {}),
      });
    }

    return MemberRepository.updateMember(id, {
      ...memberFields,
      birthDate: memberFields.birthDate ? new Date(memberFields.birthDate) : undefined,
      subscriptionExpiry: memberFields.subscriptionExpiry ? new Date(memberFields.subscriptionExpiry) : undefined,
    } as never);
  }

  static async remove(id: string): Promise<void> {
    const member = await this.getById(id);

    const [activeBorrows, unpaidFines] = await Promise.all([
      MemberRepository.countActiveBorrows(id),
      MemberRepository.countUnpaidFines(id),
    ]);

    if (activeBorrows > 0) {
      throw ApiError.conflict('Impossible de supprimer cet adhérent : des emprunts sont en cours');
    }
    if (unpaidFines > 0) {
      throw ApiError.conflict('Impossible de supprimer cet adhérent : des amendes restent impayées');
    }

    await MemberRepository.deleteViaUser(member.userId);
    await AuditService.record(AuditAction.DELETE, { entityType: 'Member', entityId: id });
  }

  static async updatePhoto(id: string, buffer: Buffer, mimeType?: string) {
    const member = await this.getById(id);
    const { url } = await uploadBufferToCloudinary(buffer, 'members/photos', mimeType);
    await MemberRepository.updateUser(member.userId, { avatarUrl: url });
    return this.getById(id);
  }

  static async generateQrCode(id: string) {
    const member = await this.getById(id);
    const payload = JSON.stringify({ type: 'member', id: member.id, matricule: member.matricule });
    const buffer = await generateQrCodeBuffer(payload);
    const { url } = await uploadBufferToCloudinary(buffer, 'members/qrcodes');
    await MemberRepository.updateMember(id, { qrCode: url });
    return url;
  }

  static async getHistory(id: string) {
    await this.getById(id);
    const [borrows, reservations, fines] = await MemberRepository.getHistory(id);
    return { borrows, reservations, fines };
  }

  static async generateCardPdf(id: string) {
    return createMemberCardPdf(await this.getById(id));
  }

  static async suspend(id: string): Promise<void> {
    await this.getById(id);
    await MemberRepository.updateStatus(id, MemberStatus.SUSPENDED);
  }

  static async reactivate(id: string): Promise<void> {
    await this.getById(id);
    await MemberRepository.updateStatus(id, MemberStatus.ACTIVE);
  }
}
