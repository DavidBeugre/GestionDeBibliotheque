import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { ReportService, ReportType } from '../services/report.service';
import { toCsv, toExcelBuffer, toPdfBuffer } from '../utils/export.util';

const VALID_TYPES: ReportType[] = [
  'popular-books',
  'never-borrowed',
  'overdue',
  'fines',
  'active-members',
  'daily-activity',
  'annual-stats',
];

function assertValidType(type: string): asserts type is ReportType {
  if (!VALID_TYPES.includes(type as ReportType)) {
    throw ApiError.badRequest(`Type de rapport inconnu : ${type}`);
  }
}

export const ReportController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    assertValidType(type);
    const data = await ReportService.getData(type, req.query as never);
    return ApiResponse.success(res, data, data.title);
  }),

  export: asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    assertValidType(type);
    const format = (req.query.format as string) ?? 'csv';
    const data = await ReportService.getData(type, req.query as never);
    const filename = `${type}-${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send('\uFEFF' + toCsv(data.columns, data.rows)); // BOM pour un bon rendu des accents dans Excel
      return;
    }

    if (format === 'excel') {
      const buffer = await toExcelBuffer(data.title, data.columns, data.rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(buffer);
      return;
    }

    if (format === 'pdf') {
      const buffer = await toPdfBuffer(data.title, data.columns, data.rows);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.send(buffer);
      return;
    }

    throw ApiError.badRequest(`Format d'export invalide : ${format} (csv, excel ou pdf attendu)`);
  }),
};
