import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BookOpen,
  Camera,
  MoreHorizontal,
  Plus,
  QrCode,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { bookService } from '@/services/book.service';
import { queryKeys, PERMISSIONS } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { BOOK_STATUS_CONFIG, COPY_STATUS_CONFIG } from '@/utils/statusConfig';
import type { CopyStatus } from '@/types';
import { BookFormDialog } from './BookFormDialog';
import { AddCopyDialog } from './AddCopyDialog';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [addCopyOpen, setAddCopyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canManage = hasPermission(PERMISSIONS.BOOK_UPDATE);

  const bookQuery = useQuery({
    queryKey: queryKeys.book(id!),
    queryFn: () => bookService.getById(id!),
    enabled: !!id,
  });

  const recommendationsQuery = useQuery({
    queryKey: ['books', id, 'recommendations'],
    queryFn: () => bookService.recommendations(id!),
    enabled: !!id,
  });

  const coverMutation = useMutation({
    mutationFn: (file: File) => bookService.uploadCover(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.book(id!) });
      toast.success('Couverture mise à jour');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible de mettre à jour la couverture")),
  });

  const qrMutation = useMutation({
    mutationFn: () => bookService.generateQrCode(id!),
    onSuccess: (url) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.book(id!) });
      window.open(url, '_blank');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de générer le QR Code')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => bookService.remove(id!),
    onSuccess: () => {
      toast.success('Livre archivé');
      navigate('/books');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'archiver ce livre")),
  });

  const updateCopyStatus = useMutation({
    mutationFn: ({ copyId, status }: { copyId: string; status: CopyStatus }) => bookService.updateCopy(id!, copyId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.book(id!) });
      toast.success('Exemplaire mis à jour');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible de mettre à jour l'exemplaire")),
  });

  const removeCopy = useMutation({
    mutationFn: (copyId: string) => bookService.removeCopy(id!, copyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.book(id!) });
      toast.success('Exemplaire supprimé');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible de supprimer l'exemplaire")),
  });

  if (bookQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="aspect-[2/3] w-full max-w-xs rounded-xl" />
          <div className="space-y-3 lg:col-span-2">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const book = bookQuery.data;
  if (!book) return null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/books')} className="-ml-2">
        <ArrowLeft className="size-4" /> Retour au catalogue
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Couverture */}
        <div className="space-y-3">
          <div className="relative aspect-[2/3] w-full max-w-xs overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
            {book.coverImageUrl ? (
              <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="size-10 text-muted-foreground" />
              </div>
            )}
          </div>
          {canManage && (
            <div className="flex max-w-xs gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) coverMutation.mutate(file);
                }}
              />
              <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()} isLoading={coverMutation.isPending}>
                <Camera className="size-3.5" /> Couverture
              </Button>
              <Button variant="outline" size="sm" onClick={() => qrMutation.mutate()} isLoading={qrMutation.isPending} aria-label="Générer le QR Code">
                <QrCode className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Informations principales */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Badge variant={BOOK_STATUS_CONFIG[book.status]?.variant}>{BOOK_STATUS_CONFIG[book.status]?.label}</Badge>
                {book.category && <Badge variant="outline">{book.category.name}</Badge>}
              </div>
              <h1 className="font-display text-2xl font-semibold leading-tight">{book.title}</h1>
              {book.subtitle && <p className="text-muted-foreground">{book.subtitle}</p>}
              <p className="mt-1 text-sm text-muted-foreground">
                {book.authors.map((a) => a.author.name).join(', ') || 'Auteur inconnu'}
                {book.publisher && ` · ${book.publisher.name}`}
                {book.year && ` · ${book.year}`}
              </p>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>Modifier</DropdownMenuItem>
                  <DropdownMenuItem destructive onClick={() => setDeleteOpen(true)}>
                    Archiver
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="card-spine pl-1">
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Exemplaires</p>
                <p className="font-data text-lg font-semibold">
                  {book.availableCopies}/{book.totalCopies}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">ISBN</p>
                <p className="font-data text-sm font-medium">{book.isbn ?? '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Cote</p>
                <p className="font-data text-sm font-medium">{book.callNumber ?? '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Langue</p>
                <p className="text-sm font-medium">{book.language ?? '—'}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="copies">Exemplaires ({book.copies.length})</TabsTrigger>
              <TabsTrigger value="recommendations">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardContent className="pt-5 text-sm leading-relaxed text-muted-foreground">
                  {book.summary || 'Aucun résumé renseigné pour ce livre.'}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="copies">
              <Card>
                {canManage && (
                  <div className="flex justify-end p-3 pb-0">
                    <Button size="sm" variant="outline" onClick={() => setAddCopyOpen(true)}>
                      <Plus className="size-3.5" /> Ajouter un exemplaire
                    </Button>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inventaire</TableHead>
                      <TableHead>Emplacement</TableHead>
                      <TableHead>Statut</TableHead>
                      {canManage && <TableHead className="w-10" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {book.copies.map((copy) => (
                      <TableRow key={copy.id}>
                        <TableCell className="font-data text-sm">{copy.inventoryNumber}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{copy.location ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={COPY_STATUS_CONFIG[copy.status]?.variant}>{COPY_STATUS_CONFIG[copy.status]?.label}</Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateCopyStatus.mutate({ copyId: copy.id, status: 'AVAILABLE' })}>
                                  Marquer disponible
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateCopyStatus.mutate({ copyId: copy.id, status: 'MAINTENANCE' })}>
                                  Mettre en maintenance
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateCopyStatus.mutate({ copyId: copy.id, status: 'DAMAGED' })}>
                                  Marquer endommagé
                                </DropdownMenuItem>
                                <DropdownMenuItem destructive onClick={() => removeCopy.mutate(copy.id)}>
                                  <Trash2 className="size-3.5" /> Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {book.copies.length === 0 && (
                  <p className="p-6 text-center text-sm text-muted-foreground">Aucun exemplaire enregistré pour ce livre.</p>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="recommendations">
              <Card>
                <CardContent className="pt-5">
                  <h2 className="mb-4 font-display font-semibold">Suggestions similaires</h2>
                  {!recommendationsQuery.data?.length ? (
                    <p className="text-sm text-muted-foreground">Aucune recommandation disponible pour le moment.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {recommendationsQuery.data.map((suggestion) => (
                        <button key={suggestion.id} onClick={() => navigate(`/books/${suggestion.id}`)} className="rounded-lg border p-3 text-left hover:bg-muted">
                          <p className="line-clamp-2 text-sm font-medium">{suggestion.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{suggestion.authors.map((a) => a.author.name).join(', ') || 'Auteur inconnu'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BookFormDialog open={editOpen} onOpenChange={setEditOpen} book={book} />
      <AddCopyDialog bookId={book.id} open={addCopyOpen} onOpenChange={setAddCopyOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Archiver ce livre ?"
        description="Le livre sera archivé et ne sera plus proposé à l'emprunt."
        confirmLabel="Archiver"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
