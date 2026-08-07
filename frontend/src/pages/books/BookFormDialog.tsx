import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bookService } from '@/services/book.service';
import { catalogService } from '@/services/catalog.service';
import { queryKeys } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { Book } from '@/types';
import { bookFormSchema, type BookFormSchema } from './bookSchema';

interface BookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null;
}

export function BookFormDialog({ open, onOpenChange, book }: BookFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!book;
  const [newAuthorName, setNewAuthorName] = useState('');

  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: catalogService.listCategories, enabled: open });
  const publishersQuery = useQuery({ queryKey: queryKeys.publishers, queryFn: catalogService.listPublishers, enabled: open });
  const authorsQuery = useQuery({ queryKey: queryKeys.authors(), queryFn: () => catalogService.listAuthors(), enabled: open });

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookFormSchema>({ resolver: zodResolver(bookFormSchema) });

  useEffect(() => {
    if (open) {
      reset({
        title: book?.title ?? '',
        subtitle: book?.subtitle ?? '',
        isbn: book?.isbn ?? '',
        summary: book?.summary ?? '',
        categoryId: book?.category?.id,
        publisherId: book?.publisher?.id,
        authorIds: book?.authors?.map(({ author }) => author.id) ?? [],
        year: book?.year ?? undefined,
        language: book?.language ?? '',
        callNumber: book?.callNumber ?? '',
        digitalFileUrl: book?.digitalFileUrl ?? '',
        externalLink: book?.externalLink ?? '',
      });
    }
  }, [open, book, reset]);

  const createAuthorMutation = useMutation({
    mutationFn: (name: string) => catalogService.createAuthor({ name }),
    onSuccess: (author) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authors() });
      setValue('authorIds', [...(getValues('authorIds') ?? []), author.id], { shouldDirty: true });
      setNewAuthorName('');
      toast.success('Auteur ajout\u00e9 et s\u00e9lectionn\u00e9');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'ajouter l'auteur")),
  });

  const mutation = useMutation({
    mutationFn: (values: BookFormSchema) =>
      isEditing ? bookService.update(book!.id, values) : bookService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success(isEditing ? 'Livre mis à jour' : 'Livre créé avec succès');
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'enregistrer le livre")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le livre' : 'Nouveau livre'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" error={!!errors.title} {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="subtitle">Sous-titre</Label>
              <Input id="subtitle" {...register('subtitle')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isbn">ISBN</Label>
              <Input id="isbn" className="font-data" {...register('isbn')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="year">Année</Label>
              <Input id="year" type="number" {...register('year')} />
            </div>

            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesQuery.data?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Éditeur</Label>
              <Controller
                control={control}
                name="publisherId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                      {publishersQuery.data?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="authorIds">Auteur(s)</Label>
              <Controller
                control={control}
                name="authorIds"
                render={({ field }) => (
                  <select
                    id="authorIds"
                    multiple
                    value={field.value ?? []}
                    onChange={(event) => field.onChange(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}
                    className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {authorsQuery.data?.map((author) => (
                      <option key={author.id} value={author.id}>{author.name}</option>
                    ))}
                  </select>
                )}
              />
              <p className="text-xs text-muted-foreground">S\u00e9lectionnez un ou plusieurs auteurs (Ctrl/Cmd + clic).</p>
              <div className="flex gap-2">
                <Input value={newAuthorName} onChange={(event) => setNewAuthorName(event.target.value)} placeholder="Nouvel auteur \u00e0 enregistrer" />
                <Button type="button" variant="outline" onClick={() => { const name = newAuthorName.trim(); if (name) createAuthorMutation.mutate(name); }} isLoading={createAuthorMutation.isPending} disabled={!newAuthorName.trim()}>
                  Ajouter
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="callNumber">Cote</Label>
              <Input id="callNumber" className="font-data" {...register('callNumber')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="language">Langue</Label>
              <Input id="language" {...register('language')} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="summary">Résumé</Label>
              <Textarea id="summary" rows={3} {...register('summary')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="digitalFileUrl">Lien du livre numérique (PDF)</Label><Input id="digitalFileUrl" type="url" placeholder="https://..." {...register('digitalFileUrl')} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="externalLink">Lien externe de lecture</Label><Input id="externalLink" type="url" placeholder="https://..." {...register('externalLink')} /></div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
              {isEditing ? 'Enregistrer' : 'Créer le livre'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
