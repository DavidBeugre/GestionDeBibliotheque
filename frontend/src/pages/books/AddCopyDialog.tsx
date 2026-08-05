import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { bookService } from '@/services/book.service';
import { queryKeys } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

interface AddCopyDialogProps {
  bookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormValues {
  inventoryNumber?: string;
  location?: string;
}

export function AddCopyDialog({ bookId, open, onOpenChange }: AddCopyDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<FormValues>();

  const mutation = useMutation({
    mutationFn: (values: FormValues) => bookService.addCopy(bookId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.book(bookId) });
      toast.success('Exemplaire ajouté');
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'ajouter l'exemplaire")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajouter un exemplaire</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="inventoryNumber">Numéro d'inventaire</Label>
            <Input id="inventoryNumber" className="font-data" placeholder="Généré automatiquement si vide" {...register('inventoryNumber')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Emplacement</Label>
            <Input id="location" placeholder="Ex: Rayon B, étagère 3" {...register('location')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
