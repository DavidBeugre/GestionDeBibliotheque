import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { resetPasswordSchema, type ResetPasswordFormValues } from './authSchemas';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  if (!token) {
    return (
      <Card className="animate-slide-up">
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <ShieldAlert className="size-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Ce lien de réinitialisation est invalide. Merci d'en demander un nouveau.
          </p>
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Demander un nouveau lien
          </Link>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await authService.resetPassword(token, values.newPassword);
      toast.success('Mot de passe réinitialisé, vous pouvez vous connecter');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Le lien a peut-être expiré, redemandez-en un'));
    }
  };

  return (
    <Card className="animate-slide-up">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input id="newPassword" type="password" error={!!errors.newPassword} {...register('newPassword')} />
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input id="confirmPassword" type="password" error={!!errors.confirmPassword} {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Réinitialiser le mot de passe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
