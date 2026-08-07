import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BookOpen, LayoutGrid, List, MoreHorizontal, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { bookService } from '@/services/book.service';
import { catalogService } from '@/services/catalog.service';
import { queryKeys, PERMISSIONS } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { BOOK_STATUS_CONFIG } from '@/utils/statusConfig';
import type { Book } from '@/types';
import { BookFormDialog } from './BookFormDialog';

type ViewMode = 'table' | 'grid';

export default function BooksListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setPage(1);
  }, [searchParams]);

  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: catalogService.listCategories });

  const params = { page, limit: 12, search: debouncedSearch || undefined, categoryId, status };
  const booksQuery = useQuery({
    queryKey: queryKeys.books(params),
    queryFn: () => bookService.list(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bookService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Livre archivé');
      setDeletingBook(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'archiver ce livre")),
  });

  const canManage = hasPermission(PERMISSIONS.BOOK_CREATE);
  const books = booksQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Livres</h1>
          <p className="text-sm text-muted-foreground">{booksQuery.data?.meta.total ?? 0} ouvrages au catalogue</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditingBook(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Nouveau livre
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Titre, ISBN, auteur, cote…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={categoryId}
            onValueChange={(v) => {
              setCategoryId(v === 'all' ? undefined : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categoriesQuery.data?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v === 'all' ? undefined : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tous statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {Object.entries(BOOK_STATUS_CONFIG).map(([value, cfg]) => (
                <SelectItem key={value} value={value}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 rounded-md border border-input p-0.5">
            <Button
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-7"
              onClick={() => setView('table')}
              aria-label="Vue tableau"
            >
              <List className="size-3.5" />
            </Button>
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-7"
              onClick={() => setView('grid')}
              aria-label="Vue cartes"
            >
              <LayoutGrid className="size-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        {booksQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Aucun livre trouvé"
            description="Essayez d'ajuster votre recherche ou vos filtres."
            action={canManage ? { label: 'Ajouter un livre', onClick: () => setFormOpen(true) } : undefined}
          />
        ) : view === 'table' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Livre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Disponibilité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((book) => (
                <TableRow key={book.id} className="cursor-pointer" onClick={() => navigate(`/books/${book.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                        {book.coverImageUrl ? (
                          <img src={book.coverImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <BookOpen className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{book.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {book.authors.map((a) => a.author.name).join(', ') || 'Auteur inconnu'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{book.category?.name ?? '—'}</TableCell>
                  <TableCell className="font-data text-sm">
                    {book.availableCopies}/{book.totalCopies}
                  </TableCell>
                  <TableCell>
                    <Badge variant={BOOK_STATUS_CONFIG[book.status]?.variant}>{BOOK_STATUS_CONFIG[book.status]?.label}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/books/${book.id}`)}>Voir la fiche</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingBook(book);
                              setFormOpen(true);
                            }}
                          >
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem destructive onClick={() => setDeletingBook(book)}>
                            Archiver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => navigate(`/books/${book.id}`)}
                className="group flex flex-col items-start gap-2 text-left"
              >
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg border border-border bg-muted shadow-xs transition-shadow group-hover:shadow-md">
                  {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="size-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 w-full">
                  <p className="truncate text-sm font-medium">{book.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{book.authors?.[0]?.author.name ?? '—'}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {booksQuery.data && <Pagination meta={booksQuery.data.meta} onPageChange={setPage} />}
      </Card>

      <BookFormDialog open={formOpen} onOpenChange={setFormOpen} book={editingBook} />

      <ConfirmDialog
        open={!!deletingBook}
        onOpenChange={(open) => !open && setDeletingBook(null)}
        title="Archiver ce livre ?"
        description={`"${deletingBook?.title}" sera archivé et ne sera plus proposé à l'emprunt. Cette action est réversible depuis la fiche du livre.`}
        confirmLabel="Archiver"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deletingBook && deleteMutation.mutate(deletingBook.id)}
      />
    </div>
  );
}
