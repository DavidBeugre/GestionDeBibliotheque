import { PublisherRepository } from '../repositories/publisher.repository';
import { ApiError } from '../utils/ApiError';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';

export class PublisherService {
  static async list(pagination: PaginationParams, search?: string) {
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    const { items, total } = await PublisherRepository.findMany(
      where,
      pagination.skip,
      pagination.limit,
      pagination.sort,
      pagination.order
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async getById(id: string) {
    const publisher = await PublisherRepository.findById(id);
    if (!publisher) throw ApiError.notFound('Éditeur introuvable');
    return publisher;
  }

  static create(data: { name: string; address?: string; phone?: string; email?: string; country?: string; website?: string }) {
    return PublisherRepository.create(data);
  }

  static async update(id: string, data: Partial<{ name: string; address: string; phone: string; email: string; country: string; website: string }>) {
    await this.getById(id);
    return PublisherRepository.update(id, data);
  }

  static async remove(id: string): Promise<void> {
    await this.getById(id);
    const bookCount = await PublisherRepository.countBooks(id);
    if (bookCount > 0) {
      throw ApiError.conflict(`Impossible de supprimer cet éditeur : ${bookCount} livre(s) y sont encore rattachés`);
    }
    await PublisherRepository.delete(id);
  }
}
