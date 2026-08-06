import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { settingsService } from '@/services/settings.service';
import { queryKeys } from '@/constants';
import { API_BASE_URL } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const settingsSchema = z.object({
  libraryName: z.string().min(1, 'Le nom est requis'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  currency: z.string().min(3).max(3),
  borrowDurationDays: z.coerce.number().int().min(1).max(90),
  maxBorrowsPerUser: z.coerce.number().int().min(1).max(20),
  finePerDay: z.coerce.number().min(0),
});
const resolveMediaUrl = (url: string): string => url.startsWith('/') ? `${API_BASE_URL.replace(/\/api\/v1$/, '')}${url}` : url;
type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const settingsQuery = useQuery({ queryKey: queryKeys.settings, queryFn: settingsService.get });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    if (settingsQuery.data) {
      reset({
        libraryName: settingsQuery.data.libraryName,
        address: settingsQuery.data.address ?? '',
        phone: settingsQuery.data.phone ?? '',
        email: settingsQuery.data.email ?? '',
        currency: settingsQuery.data.currency,
        borrowDurationDays: settingsQuery.data.borrowDurationDays,
        maxBorrowsPerUser: settingsQuery.data.maxBorrowsPerUser,
        finePerDay: settingsQuery.data.finePerDay,
      });
    }
  }, [settingsQuery.data, reset]);

  const updateMutation = useMutation({
    mutationFn: settingsService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      toast.success('Paramètres mis à jour');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour les paramètres')),
  });

  const logoMutation = useMutation({
    mutationFn: settingsService.updateLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      toast.success('Logo mis à jour');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour le logo')),
  });

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Configuration générale de la bibliothèque</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>Nom, logo et coordonnées affichés dans l'application et sur les documents générés.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
              {settingsQuery.data?.logoUrl ? (
                <img src={resolveMediaUrl(settingsQuery.data.logoUrl)} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Library className="size-6 text-muted-foreground" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) logoMutation.mutate(file);
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} isLoading={logoMutation.isPending}>
              <Camera className="size-3.5" /> Changer le logo
            </Button>
          </div>

          <form onSubmit={handleSubmit((values) => updateMutation.mutate(values))} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="libraryName">Nom de la bibliothèque</Label>
              <Input id="libraryName" error={!!errors.libraryName} {...register('libraryName')} />
              {errors.libraryName && <p className="text-xs text-destructive">{errors.libraryName.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" error={!!errors.email} {...register('email')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" {...register('phone')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...register('address')} />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="currency">Devise</Label>
                <Input id="currency" className="font-data" {...register('currency')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="borrowDurationDays">Durée d'emprunt (j)</Label>
                <Input id="borrowDurationDays" type="number" className="font-data" {...register('borrowDurationDays')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxBorrowsPerUser">Emprunts max.</Label>
                <Input id="maxBorrowsPerUser" type="number" className="font-data" {...register('maxBorrowsPerUser')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="finePerDay">Amende / jour</Label>
                <Input id="finePerDay" type="number" step="0.01" className="font-data" {...register('finePerDay')} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting || updateMutation.isPending}>
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
