import { Response } from 'express';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Succès', statusCode = 200, pagination?: Pagination) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(pagination ? { pagination } : {}),
    });
  }

  static created<T>(res: Response, data: T, message = 'Ressource créée avec succès') {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(res: Response, message: string, statusCode = 500, details?: unknown) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(details ? { details } : {}),
    });
  }
}
