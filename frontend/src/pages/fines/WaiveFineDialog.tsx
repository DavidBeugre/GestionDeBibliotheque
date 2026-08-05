import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fineService } from '@/services/fine.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { Fine } from '@/types';

interface FormValues {
  reason: string;
}

export function WaiveFineDialog({ fine, open, onOpenChange }: { fine: Fine | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();

  const mutation = useMutation({
    mutationFn: (values: FormValues) => fineService.waive(fine!.id, values.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      toast.success('Amende remise avec succès');
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible de remettre l'amende")),
  });

  if (!fine) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Remettre cette amende ?</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Motif de la remise</Label>
            <Textarea id="reason" rows={3} error={!!errors.reason} {...register('reason', { required: 'Un motif est requis' })} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
              Confirmer la remise
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
