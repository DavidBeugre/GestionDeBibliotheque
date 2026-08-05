import { AuthorRepository } from '../repositories/author.repository';
import { ApiError } from '../utils/ApiError';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';
import { uploadBufferToCloudinary } from '../utils/cloudinary.util';

export class AuthorService {
  static async list(pagination: PaginationParams, search?: string) {
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    const { items, total } = await AuthorRepository.findMany(
      where,
      pagination.skip,
      pagination.limit,
      pagination.sort,
      pagination.order
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async getById(id: string) {
    const author = await AuthorRepository.findById(id);
    if (!author) throw ApiError.notFound('Auteur introuvable');
    return author;
  }

  static create(data: {
    name: string;
    nationality?: string;
    birthDate?: string;
    deathDate?: string;
    biography?: string;
    website?: string;
  }) {
    return AuthorRepository.create({
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      deathDate: data.deathDate ? new Date(data.deathDate) : undefined,
    });
  }

  static async update(
    id: string,
    data: Partial<{ name: string; nationality: string; birthDate: string; deathDate: string; biography: string; website: string }>
  ) {
    await this.getById(id);
    return AuthorRepository.update(id, {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      deathDate: data.deathDate ? new Date(data.deathDate) : undefined,
    });
  }

  static async remove(id: string): Promise<void> {
    await this.getById(id);
    const bookCount = await AuthorRepository.countBooks(id);
    if (bookCount > 0) {
      throw ApiError.conflict(`Impossible de supprimer cet auteur : ${bookCount} livre(s) lui sont encore rattachés`);
    }
    await AuthorRepository.delete(id);
  }

  static async updatePhoto(id: string, buffer: Buffer, mimeType?: string) {
    await this.getById(id);
    const { url } = await uploadBufferToCloudinary(buffer, 'authors', mimeType);
    return AuthorRepository.update(id, { photoUrl: url });
  }
}
