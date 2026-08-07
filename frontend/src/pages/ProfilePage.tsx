import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROLE_LABELS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setEmail(user.email ?? '');
  }, [user]);

  if (!user) return null;

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('Le prénom, le nom et l’adresse e-mail sont requis');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ firstName, lastName, email });
      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour le profil'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Les deux nouveaux mots de passe ne correspondent pas');
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Mot de passe modifié. Reconnectez-vous sur vos autres appareils.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Impossible de modifier le mot de passe'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Mon profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gérez vos informations personnelles et la sécurité de votre compte.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound className="size-5" /> Informations personnelles</CardTitle>
          <CardDescription>Ces informations sont affichées dans Shelfly.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-first-name">Prénom</Label>
                <Input id="profile-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-last-name">Nom</Label>
                <Input id="profile-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Adresse e-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="profile-email" type="email" className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <span className="text-sm text-muted-foreground">Rôle : <Badge variant="outline">{ROLE_LABELS[user.role] ?? user.role}</Badge></span>
              <Button type="submit" isLoading={savingProfile}><Save className="size-4" /> Enregistrer</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="size-5" /> Mot de passe</CardTitle>
          <CardDescription>Utilisez un mot de passe d’au moins 8 caractères.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div className="space-y-2">
              <Label htmlFor="old-password">Mot de passe actuel</Label>
              <Input id="old-password" type="password" autoComplete="current-password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </div>
            </div>
            <Button type="submit" isLoading={savingPassword}><ShieldCheck className="size-4" /> Modifier le mot de passe</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
