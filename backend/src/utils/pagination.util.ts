export interface RawListQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: string;
  [key: string]: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sort: string;
  order: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(
  query: RawListQuery,
  allowedSortFields: string[],
  defaultSort = 'createdAt'
): PaginationParams {
  const page = Math.max(DEFAULT_PAGE, parseInt(query.page ?? '', 10) || DEFAULT_PAGE);
  const rawLimit = parseInt(query.limit ?? '', 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));

  const sort = allowedSortFields.includes(query.sort ?? '') ? (query.sort as string) : defaultSort;
  const order: 'asc' | 'desc' = query.order === 'asc' ? 'asc' : 'desc';

  return { page, limit, skip: (page - 1) * limit, sort, order };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
