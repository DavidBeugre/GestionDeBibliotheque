import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { bookService } from '@/services/book.service';
import { catalogService } from '@/services/catalog.service';
import { memberPortalService } from '@/services/memberPortal.service';
import { queryKeys } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { Book } from '@/types';

export default function MemberCatalogPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [sort, setSort] = useState<'createdAt' | 'title' | 'availableCopies'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();
  const params = { page, limit: 12, search: debouncedSearch || undefined, status: 'ACTIVE', categoryId, sort, order };
  const booksQuery = useQuery({ queryKey: queryKeys.books(params), queryFn: () => bookService.list(params) });
  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: catalogService.listCategories });

  const reserveMutation = useMutation({
    mutationFn: memberPortalService.reserve,
    onSuccess: () => {
      toast.success('Réservation enregistrée. Vous serez informé lorsque le livre sera disponible.');
      queryClient.invalidateQueries({ queryKey: ['member-portal'] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de réserver ce livre')),
  });

  const books = booksQuery.data?.items ?? [];

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setPage(1);
  }, [searchParams]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Catalogue</h1>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Select value={categoryId ?? 'all'} onValueChange={(value) => { setCategoryId(value === 'all' ? undefined : value); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Toutes catégories" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Toutes catégories</SelectItem>{categoriesQuery.data?.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={`${sort}:${order}`} onValueChange={(value) => { const [nextSort, nextOrder] = value.split(':') as [typeof sort, typeof order]; setSort(nextSort); setOrder(nextOrder); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="createdAt:desc">Nouveautés</SelectItem><SelectItem value="title:asc">Titre A à Z</SelectItem><SelectItem value="availableCopies:desc">Plus disponibles</SelectItem></SelectContent>
          </Select>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Recherchez un ouvrage et réservez-le lorsqu’il n’est plus disponible.</p>
      </div>

      <Card className="p-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Titre, auteur ou ISBN…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div></Card>

      {booksQuery.isLoading ? <p className="text-sm text-muted-foreground">Chargement du catalogue…</p> : books.length === 0 ? <EmptyState icon={BookOpen} title="Aucun livre trouvé" description="Essayez une autre recherche." /> : (
        <Card><CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return <div key={book.id} className="flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40" onClick={() => setSelectedBook(book)}>
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">{book.coverImageUrl ? <img src={book.coverImageUrl} alt="" className="size-full object-cover" /> : <BookOpen className="size-5 text-muted-foreground" />}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{book.title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{book.authors?.map((item) => item.author.name).join(', ') || 'Auteur inconnu'}</p>{(book.digitalFileUrl || book.externalLink) && <a className="mt-2 inline-block text-xs font-medium text-primary hover:underline" href={book.digitalFileUrl || book.externalLink || '#'} target="_blank" rel="noreferrer">Lire le livre numérique</a>}<div className="mt-3 flex items-center justify-between gap-2"><Badge variant={isAvailable ? 'success' : 'warning'}>{isAvailable ? `${book.availableCopies} disponible(s)` : 'Indisponible'}</Badge>{isAvailable ? <span className="text-xs text-muted-foreground">À emprunter au comptoir</span> : <Button size="sm" onClick={() => reserveMutation.mutate(book.id)} isLoading={reserveMutation.isPending}>Réserver</Button>}</div></div>
            </div>;
          })}
        </CardContent></Card>
      )}
      {booksQuery.data && <Pagination meta={booksQuery.data.meta} onPageChange={setPage} />}
      <Dialog open={!!selectedBook} onOpenChange={(open) => { if (!open) setSelectedBook(null); }}>
        <DialogContent className="max-w-lg">
          {selectedBook && <><DialogHeader><DialogTitle>{selectedBook.title}</DialogTitle></DialogHeader><div className="space-y-4"><div className="flex gap-4"><div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">{selectedBook.coverImageUrl ? <img src={selectedBook.coverImageUrl} alt="" className="size-full object-cover" /> : <BookOpen className="size-7 text-muted-foreground" />}</div><div><p className="font-medium">{selectedBook.authors.map((item) => item.author.name).join(', ') || 'Auteur inconnu'}</p><p className="mt-1 text-sm text-muted-foreground">{selectedBook.category?.name || 'Sans catégorie'} · {selectedBook.year || 'Année non renseignée'}</p><Badge className="mt-2" variant={selectedBook.availableCopies > 0 ? 'success' : 'warning'}>{selectedBook.availableCopies > 0 ? `${selectedBook.availableCopies} exemplaire(s) disponible(s)` : 'Indisponible'}</Badge></div></div><p className="text-sm leading-relaxed text-muted-foreground">{selectedBook.summary || 'Aucun résumé renseigné pour ce livre.'}</p>{(selectedBook.digitalFileUrl || selectedBook.externalLink) && <Button asChild><a href={selectedBook.digitalFileUrl || selectedBook.externalLink || '#'} target="_blank" rel="noreferrer">Lire le livre numérique</a></Button>}</div></>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
