import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BarChart3, Download, FileSpreadsheet, FileText, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/common/EmptyState';
import { reportService, type ReportType } from '@/services/report.service';
import { queryKeys } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'popular-books', label: 'Livres les plus empruntés' },
  { value: 'never-borrowed', label: 'Livres jamais empruntés' },
  { value: 'overdue', label: 'Emprunts en retard' },
  { value: 'fines', label: 'Amendes' },
  { value: 'active-members', label: 'Adhérents les plus actifs' },
  { value: 'daily-activity', label: 'Activité quotidienne' },
  { value: 'annual-stats', label: 'Statistiques annuelles' },
];

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>('popular-books');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [date, setDate] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [exporting, setExporting] = useState<'csv' | 'excel' | 'pdf' | null>(null);

  const params: Record<string, string | undefined> =
    type === 'fines'
      ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }
      : type === 'daily-activity'
        ? { date: date || undefined }
        : type === 'annual-stats'
          ? { year }
          : {};

  const reportQuery = useQuery({
    queryKey: queryKeys.report(type, params),
    queryFn: () => reportService.getData(type, params),
  });

  async function handleExport(format: 'csv' | 'excel' | 'pdf') {
    setExporting(format);
    try {
      await reportService.downloadExport(type, format, params);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de générer l'export"));
    } finally {
      setExporting(null);
    }
  }

  const data = reportQuery.data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Rapports</h1>
        <p className="text-sm text-muted-foreground">Statistiques et exports pour le suivi de la bibliothèque</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="space-y-1.5">
            <Label>Type de rapport</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'fines' && (
            <>
              <div className="space-y-1.5">
                <Label>Du</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Au</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </>
          )}

          {type === 'daily-activity' && (
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}

          {type === 'annual-stats' && (
            <div className="space-y-1.5">
              <Label>Année</Label>
              <Input type="number" className="w-28" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          )}

          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} isLoading={exporting === 'csv'}>
              <Download className="size-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')} isLoading={exporting === 'excel'}>
              <FileSpreadsheet className="size-3.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} isLoading={exporting === 'pdf'}>
              <FileText className="size-3.5" /> PDF
            </Button>
          </div>
        </div>
      </Card>

      {data?.summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(data.summary).map(([key, value]) => (
            <Card key={key} className="card-spine card-spine-accent pl-1">
              <CardContent className="py-3">
                <p className="text-xs capitalize text-muted-foreground">{key}</p>
                <p className="font-data text-lg font-semibold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 border-b border-border p-4">
          <BarChart3 className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{data?.title ?? '…'}</p>
        </div>

        {reportQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !data || data.rows.length === 0 ? (
          <EmptyState icon={TableIcon} title="Aucune donnée" description="Aucun résultat pour ces critères." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {data.columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, i) => (
                <TableRow key={i}>
                  {data.columns.map((col) => (
                    <TableCell key={col.key} className="text-sm">
                      {row[col.key] ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
