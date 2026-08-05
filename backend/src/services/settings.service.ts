import { SettingsRepository } from '../repositories/settings.repository';
import { uploadBufferToCloudinary } from '../utils/cloudinary.util';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';

interface UpdateSettingsInput {
  libraryName?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  borrowDurationDays?: number;
  maxBorrowsPerUser?: number;
  finePerDay?: number;
  holidays?: string[]; // dates ISO
}

export class SettingsService {
  static getPublic() {
    return SettingsRepository.getFull();
  }

  static async update(input: UpdateSettingsInput, userId?: string) {
    const updated = await SettingsRepository.update(input as never);
    await AuditService.record(AuditAction.UPDATE, { userId, entityType: 'LibrarySettings', entityId: updated.id });
    return updated;
  }

  static async updateLogo(buffer: Buffer, userId?: string, mimeType?: string) {
    const { url } = await uploadBufferToCloudinary(buffer, 'settings', mimeType);
    const updated = await SettingsRepository.update({ logoUrl: url });
    await AuditService.record(AuditAction.UPDATE, {
      userId,
      entityType: 'LibrarySettings',
      entityId: updated.id,
      metadata: { action: 'logo' },
    });
    return updated;
  }
}
