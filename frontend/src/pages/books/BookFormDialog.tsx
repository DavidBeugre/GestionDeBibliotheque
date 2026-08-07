import { useEffect } from 'react';
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

  const categoriesQuery = useQuery({ queryKey: queryKeys.categories, queryFn: catalogService.listCategories, enabled: open });
  const publishersQuery = useQuery({ queryKey: queryKeys.publishers, queryFn: catalogService.listPublishers, enabled: open });

  const {
    register,
    handleSubmit,
    reset,
    control,
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
        year: book?.year ?? undefined,
        language: book?.language ?? '',
        callNumber: book?.callNumber ?? '',
      });
    }
  }, [open, book, reset]);

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
