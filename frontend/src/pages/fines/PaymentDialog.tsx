import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paymentService } from '@/services/fine.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { Fine } from '@/types';

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Le montant doit être positif'),
  method: z.string().min(1, 'Le mode de paiement est requis'),
  reference: z.string().optional(),
});
type PaymentFormValues = z.infer<typeof paymentSchema>;

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'CARD', label: 'Carte bancaire' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
];

export function PaymentDialog({ fine, open, onOpenChange }: { fine: Fine | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    values: { amount: fine?.amount ?? 0, method: 'CASH', reference: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: PaymentFormValues) => paymentService.create({ fineId: fine!.id, ...values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Paiement enregistré avec succès');
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'enregistrer le paiement")),
  });

  if (!fine) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Encaisser le paiement</DialogTitle>
          <DialogDescription>
            Amende de {fine.amount} — {fine.reason ?? 'sans motif précisé'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Montant</Label>
            <Input id="amount" type="number" step="0.01" className="font-data" error={!!errors.amount} {...register('amount')} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Mode de paiement</Label>
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reference">Référence (optionnel)</Label>
            <Input id="reference" {...register('reference')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
              Encaisser
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
