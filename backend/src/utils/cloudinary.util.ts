import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { ApiError } from './ApiError';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

const uploadDirectory = path.resolve(process.cwd(), 'uploads');

const extensionsByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

function getExtension(mimeType: string): string {
  return extensionsByMimeType[mimeType] ?? 'img';
}

async function uploadLocally(buffer: Buffer, mimeType: string): Promise<CloudinaryUploadResult> {
  const filename = `${randomUUID()}.${getExtension(mimeType)}`;
  await fs.mkdir(uploadDirectory, { recursive: true });
  await fs.writeFile(path.join(uploadDirectory, filename), buffer);
  return { url: `/uploads/${filename}`, publicId: filename };
}

export function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  mimeType = 'image/png'
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    return uploadLocally(buffer, mimeType);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `library/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(ApiError.internal(`Échec de l'upload vers Cloudinary : ${error?.message ?? 'erreur inconnue'}`));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured) return;
  await cloudinary.uploader.destroy(publicId).catch(() => undefined);
}
