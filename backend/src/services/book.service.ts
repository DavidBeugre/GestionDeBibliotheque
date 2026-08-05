import { BookStatus, CopyStatus, Prisma } from '@prisma/client';
import { BookRepository } from '../repositories/book.repository';
import { BookCopyRepository } from '../repositories/bookCopy.repository';
import { ApiError } from '../utils/ApiError';
import { PaginationParams, buildPaginationMeta } from '../utils/pagination.util';
import { BookFilters, buildBookWhereClause } from '../utils/bookQuery.util';
import { uploadBufferToCloudinary } from '../utils/cloudinary.util';
import { generateQrCodeBuffer } from '../utils/qrcode.util';

interface CreateBookInput {
  title: string;
  subtitle?: string;
  isbn?: string;
  summary?: string;
  description?: string;
  categoryId?: string;
  publisherId?: string;
  authorIds?: string[];
  collection?: string;
  edition?: string;
  year?: number;
  pageCount?: number;
  language?: string;
  callNumber?: string;
  location?: string;
  price?: number;
  purchaseDate?: string;
  acquisitionSource?: string;
  tags?: string[];
  keywords?: string[];
  digitalFileUrl?: string;
  externalLink?: string;
}

export class BookService {
  static async list(pagination: PaginationParams, filters: BookFilters) {
    const where = buildBookWhereClause(filters);
    const { items, total } = await BookRepository.findMany(
      where,
      pagination.skip,
      pagination.limit,
      pagination.sort,
      pagination.order
    );
    return { items, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  static async getById(id: string) {
    const book = await BookRepository.findById(id);
    if (!book) throw ApiError.notFound('Livre introuvable');
    return book;
  }

  static async create(input: CreateBookInput) {
    if (input.isbn) {
      const existing = await BookRepository.findByIsbn(input.isbn);
      if (existing) throw ApiError.conflict('Un livre avec cet ISBN existe déjà');
    }

    const data: Prisma.BookCreateInput = {
      title: input.title,
      subtitle: input.subtitle,
      isbn: input.isbn,
      summary: input.summary,
      description: input.description,
      collection: input.collection,
      edition: input.edition,
      year: input.year,
      pageCount: input.pageCount,
      language: input.language,
      callNumber: input.callNumber,
      location: input.location,
      price: input.price,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      acquisitionSource: input.acquisitionSource as never,
      tags: input.tags ?? [],
      keywords: input.keywords ?? [],
      digitalFileUrl: input.digitalFileUrl,
      externalLink: input.externalLink,
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      ...(input.publisherId ? { publisher: { connect: { id: input.publisherId } } } : {}),
      ...(input.authorIds?.length
        ? { authors: { create: input.authorIds.map((authorId) => ({ authorId })) } }
        : {}),
    };

    return BookRepository.create(data);
  }

  static async update(id: string, input: Partial<CreateBookInput> & { status?: BookStatus }) {
    await this.getById(id);

    if (input.isbn) {
      const existing = await BookRepository.findByIsbn(input.isbn);
      if (existing && existing.id !== id) throw ApiError.conflict('Un livre avec cet ISBN existe déjà');
    }

    const { authorIds, categoryId, publisherId, purchaseDate, acquisitionSource, ...rest } = input;

    const data: Prisma.BookUpdateInput = {
      ...rest,
      ...(purchaseDate ? { purchaseDate: new Date(purchaseDate) } : {}),
      ...(acquisitionSource ? { acquisitionSource: acquisitionSource as never } : {}),
      ...(categoryId !== undefined
        ? categoryId
          ? { category: { connect: { id: categoryId } } }
          : { category: { disconnect: true } }
        : {}),
      ...(publisherId !== undefined
        ? publisherId
          ? { publisher: { connect: { id: publisherId } } }
          : { publisher: { disconnect: true } }
        : {}),
      ...(authorIds
        ? { authors: { deleteMany: {}, create: authorIds.map((authorId) => ({ authorId })) } }
        : {}),
    };

    return BookRepository.update(id, data);
  }

  /** Suppression douce par défaut : un livre avec un historique ne doit jamais disparaître silencieusement. */
  static async remove(id: string): Promise<void> {
    await this.getById(id);
    const activeBorrows = await BookRepository.countActiveBorrowsForBook(id);
    if (activeBorrows > 0) {
      throw ApiError.conflict("Impossible d'archiver ce livre : des exemplaires sont actuellement empruntés");
    }
    await BookRepository.archive(id);
  }

  static async updateCover(id: string, buffer: Buffer, mimeType?: string) {
    await this.getById(id);
    const { url } = await uploadBufferToCloudinary(buffer, 'books/covers', mimeType);
    return BookRepository.update(id, { coverImageUrl: url });
  }

  static async generateQrCode(id: string) {
    const book = await this.getById(id);
    const payload = JSON.stringify({ type: 'book', id: book.id, isbn: book.isbn });
    const buffer = await generateQrCodeBuffer(payload);
    const { url } = await uploadBufferToCloudinary(buffer, 'books/qrcodes');
    await BookRepository.update(id, { qrCode: url });
    return url;
  }

  // -------------------- Gestion des exemplaires --------------------

  static async listCopies(bookId: string) {
    await this.getById(bookId);
    return BookCopyRepository.listForBook(bookId);
  }

  static async addCopy(bookId: string, input: { inventoryNumber?: string; condition?: string; location?: string }) {
    await this.getById(bookId);

    const inventoryNumber = input.inventoryNumber ?? (await BookCopyRepository.generateNextInventoryNumber());
    const existing = await BookCopyRepository.findByInventoryNumber(inventoryNumber);
    if (existing) throw ApiError.conflict('Ce numéro d’inventaire est déjà utilisé');

    const copy = await BookCopyRepository.create({
      book: { connect: { id: bookId } },
      inventoryNumber,
      condition: input.condition as never,
      location: input.location,
    });

    await BookRepository.recalculateCopyCounts(bookId);
    return copy;
  }

  static async updateCopy(
    bookId: string,
    copyId: string,
    input: { condition?: string; location?: string; status?: CopyStatus }
  ) {
    const copy = await BookCopyRepository.findById(copyId);
    if (!copy || copy.bookId !== bookId) throw ApiError.notFound('Exemplaire introuvable pour ce livre');

    if (input.status && input.status !== copy.status) {
      const activeBorrows = await BookCopyRepository.countActiveBorrowsForCopy(copyId);
      if (activeBorrows > 0 && input.status === 'AVAILABLE') {
        throw ApiError.conflict('Impossible de marquer disponible un exemplaire actuellement emprunté');
      }
    }

    const updated = await BookCopyRepository.update(copyId, {
      condition: input.condition as never,
      location: input.location,
      status: input.status,
    });

    await BookRepository.recalculateCopyCounts(bookId);
    return updated;
  }

  static async removeCopy(bookId: string, copyId: string): Promise<void> {
    const copy = await BookCopyRepository.findById(copyId);
    if (!copy || copy.bookId !== bookId) throw ApiError.notFound('Exemplaire introuvable pour ce livre');

    const activeBorrows = await BookCopyRepository.countActiveBorrowsForCopy(copyId);
    if (activeBorrows > 0) {
      throw ApiError.conflict('Impossible de supprimer un exemplaire actuellement emprunté');
    }

    await BookCopyRepository.delete(copyId);
    await BookRepository.recalculateCopyCounts(bookId);
  }
}
