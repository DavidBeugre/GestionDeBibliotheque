import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ReportColumn {
  key: string;
  label: string;
}

export type ReportRow = Record<string, string | number | null | undefined>;

/** Échappe une valeur pour l'inclusion dans une cellule CSV (RFC 4180). */
function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(columns: ReportColumn[], rows: ReportRow[]): string {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(','));
  return [header, ...lines].join('\n');
}

export async function toExcelBuffer(title: string, columns: ReportColumn[], rows: ReportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Shelfly';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title.slice(0, 31) || 'Rapport');

  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(c.label.length + 4, 14) }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F3EE' } };

  rows.forEach((row) => sheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function toPdfBuffer(title: string, columns: ReportColumn[], rows: ReportRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / columns.length;
    const rowHeight = 20;

    doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').fillColor('#666666').text(`Généré le ${new Date().toLocaleString('fr-FR')}`);
    doc.moveDown(1);

    function drawHeader() {
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F4A37');
      columns.forEach((col, i) => {
        doc.text(col.label, doc.page.margins.left + i * colWidth, y, { width: colWidth - 6 });
      });
      doc.moveDown(1);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor('#DDDDDD')
        .stroke();
      doc.moveDown(0.3);
    }

    drawHeader();
    doc.font('Helvetica').fontSize(8.5).fillColor('#222222');

    rows.forEach((row) => {
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawHeader();
        doc.font('Helvetica').fontSize(8.5).fillColor('#222222');
      }
      const y = doc.y;
      columns.forEach((col, i) => {
        const value = row[col.key];
        doc.text(value === null || value === undefined ? '—' : String(value), doc.page.margins.left + i * colWidth, y, {
          width: colWidth - 6,
        });
      });
      doc.moveDown(1);
    });

    doc.end();
  });
}
