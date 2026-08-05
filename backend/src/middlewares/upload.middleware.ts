import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

function imageFileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Seuls les fichiers image sont autorisés (jpg, png, webp...)'));
    return;
  }
  cb(null, true);
}

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: imageFileFilter,
});
