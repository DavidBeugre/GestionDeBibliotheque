import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { MailCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { authService } from '@/services/auth.service';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from './authSchemas';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    // Le backend renvoie toujours un succès générique (anti-énumération d'emails, voir Étape 3) :
    // on affiche donc systématiquement le même message de confirmation.
    await authService.forgotPassword(values.email).catch(() => undefined);
    setSent(true);
  };

  if (sent) {
    return (
      <Card className="animate-slide-up">
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <MailCheck className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">
            Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.
          </p>
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">
            Indiquez votre adresse email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" error={!!errors.email} {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Envoyer le lien
          </Button>
          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Retour à la connexion
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
