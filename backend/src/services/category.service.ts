import { CategoryRepository } from '../repositories/category.repository';
import { ApiError } from '../utils/ApiError';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';

export class CategoryService {
  static async list(pagination: PaginationParams, search?: string) {
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    const { items, total } = await CategoryRepository.findMany(
      where,
      pagination.skip,
      pagination.limit,
      pagination.sort,
      pagination.order
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async getById(id: string) {
    const category = await CategoryRepository.findById(id);
    if (!category) throw ApiError.notFound('Catégorie introuvable');
    return category;
  }

  static async create(data: { name: string; description?: string; color?: string; icon?: string }) {
    const existing = await CategoryRepository.findByName(data.name);
    if (existing) throw ApiError.conflict('Une catégorie avec ce nom existe déjà');
    return CategoryRepository.create(data);
  }

  static async update(id: string, data: Partial<{ name: string; description: string; color: string; icon: string }>) {
    await this.getById(id);
    return CategoryRepository.update(id, data);
  }

  static async remove(id: string): Promise<void> {
    await this.getById(id);
    const bookCount = await CategoryRepository.countBooks(id);
    if (bookCount > 0) {
      throw ApiError.conflict(
        `Impossible de supprimer cette catégorie : ${bookCount} livre(s) y sont encore rattachés`
      );
    }
    await CategoryRepository.delete(id);
  }
}
