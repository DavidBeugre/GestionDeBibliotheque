import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { memberService } from '@/services/member.service';
import { MEMBER_TYPE_LABELS } from '@/utils/statusConfig';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { Member } from '@/types';
import { memberFormSchema, type MemberFormSchema } from './memberSchema';

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
}

export function MemberFormDialog({ open, onOpenChange, member }: MemberFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!member;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormSchema>({ resolver: zodResolver(memberFormSchema) });

  useEffect(() => {
    if (open) {
      reset({
        email: member?.user.email ?? '',
        firstName: member?.user.firstName ?? '',
        lastName: member?.user.lastName ?? '',
        phone: member?.user.phone ?? '',
        memberType: member?.memberType,
      });
    }
  }, [open, member, reset]);

  const mutation = useMutation({
    mutationFn: (values: MemberFormSchema) =>
      isEditing ? memberService.update(member!.id, values) : memberService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(isEditing ? 'Adhérent mis à jour' : 'Adhérent créé, ses identifiants ont été envoyés par email');
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'enregistrer l'adhérent")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'adhérent" : 'Nouvel adhérent'}</DialogTitle>
          {!isEditing && (
            <DialogDescription>
              Un compte et un mot de passe temporaire seront créés automatiquement et envoyés par email.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" error={!!errors.firstName} {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" error={!!errors.lastName} {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" disabled={isEditing} error={!!errors.email} {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" {...register('phone')} />
            </div>

            <div className="space-y-1.5">
              <Label>Type d'adhérent</Label>
              <Controller
                control={control}
                name="memberType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MEMBER_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...register('address')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
              {isEditing ? 'Enregistrer' : "Créer l'adhérent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
