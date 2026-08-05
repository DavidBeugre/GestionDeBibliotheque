import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@/types';

export function Pagination({ meta, onPageChange }: { meta: PaginationMeta; onPageChange: (page: number) => void }) {
  if (meta.totalPages <= 1) return null;

  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex items-center justify-between border-t border-border px-1 py-3">
      <p className="text-xs text-muted-foreground">
        {from}–{to} sur {meta.total}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label="Page précédente"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-data px-2 text-xs text-muted-foreground">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label="Page suivante"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
