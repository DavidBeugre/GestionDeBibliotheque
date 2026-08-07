import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { bookService } from '@/services/book.service';
import { memberPortalService } from '@/services/memberPortal.service';
import { queryKeys } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export default function MemberCatalogPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();
  const params = { page, limit: 12, search: debouncedSearch || undefined, status: 'ACTIVE' };
  const booksQuery = useQuery({ queryKey: queryKeys.books(params), queryFn: () => bookService.list(params) });

  const reserveMutation = useMutation({
    mutationFn: memberPortalService.reserve,
    onSuccess: () => {
      toast.success('Réservation enregistrée. Vous serez informé lorsque le livre sera disponible.');
      queryClient.invalidateQueries({ queryKey: ['member-portal'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de réserver ce livre')),
  });

  const books = booksQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Catalogue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Recherchez un ouvrage et réservez-le lorsqu’il n’est plus disponible.</p>
      </div>

      <Card className="p-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Titre, auteur ou ISBN…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div></Card>

      {booksQuery.isLoading ? <p className="text-sm text-muted-foreground">Chargement du catalogue…</p> : books.length === 0 ? <EmptyState icon={BookOpen} title="Aucun livre trouvé" description="Essayez une autre recherche." /> : (
        <Card><CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return <div key={book.id} className="flex gap-3 rounded-lg border p-3">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">{book.coverImageUrl ? <img src={book.coverImageUrl} alt="" className="size-full object-cover" /> : <BookOpen className="size-5 text-muted-foreground" />}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{book.title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{book.authors?.map((item) => item.author.name).join(', ') || 'Auteur inconnu'}</p><div className="mt-3 flex items-center justify-between gap-2"><Badge variant={isAvailable ? 'success' : 'warning'}>{isAvailable ? `${book.availableCopies} disponible(s)` : 'Indisponible'}</Badge>{isAvailable ? <span className="text-xs text-muted-foreground">À emprunter au comptoir</span> : <Button size="sm" onClick={() => reserveMutation.mutate(book.id)} isLoading={reserveMutation.isPending}>Réserver</Button>}</div></div>
            </div>;
          })}
        </CardContent></Card>
      )}
      {booksQuery.data && <Pagination meta={booksQuery.data.meta} onPageChange={setPage} />}
    </div>
  );
}
