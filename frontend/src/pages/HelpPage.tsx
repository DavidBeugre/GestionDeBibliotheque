import { BookOpen, QrCode, ScanLine, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const readerSteps = [
  ['Rechercher un livre', 'Ouvrez Catalogue, recherchez par titre, auteur ou ISBN puis utilisez les filtres.'],
  ['Réserver un ouvrage', 'Lorsqu’un livre est indisponible, sélectionnez Réserver. Vous serez averti dès son retour.'],
  ['Emprunter au comptoir', 'Présentez votre QR Code ou votre carte au personnel de la bibliothèque.'],
  ['Suivre vos échéances', 'Consultez votre tableau de bord, renouvelez si possible et ajoutez un rappel à votre calendrier.'],
];

const staffSteps = [
  ['Créer un livre', 'Ajoutez le titre, les auteurs, la catégorie et un exemplaire. Une couverture peut être envoyée ensuite.'],
  ['Enregistrer un emprunt', 'Depuis Emprunts ou Scanner, identifiez l’adhérent et l’exemplaire puis confirmez l’opération.'],
  ['Gérer le catalogue', 'Les pages Auteurs et Référentiel permettent de maintenir auteurs, éditeurs et catégories.'],
  ['Suivre l’activité', 'Le tableau de bord, les rapports et les notifications centralisent les retards et réservations.'],
];

export default function HelpPage() {
  const { user } = useAuth();
  const isReader = user?.role === 'READER';
  const steps = isReader ? readerSteps : staffSteps;

  return <div className="space-y-6">
    <div><h1 className="font-display text-2xl font-semibold">Aide & démarrage rapide</h1><p className="mt-1 text-sm text-muted-foreground">Les gestes essentiels pour profiter pleinement de Shelfly.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{steps.map(([title, description], index) => <Card key={title} className="card-spine"><CardContent className="py-5"><span className="font-data text-xs text-primary">ÉTAPE {index + 1}</span><h2 className="mt-2 font-display font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p></CardContent></Card>)}</div>
    <div className="grid gap-5 lg:grid-cols-3">
      <Card><CardHeader><QrCode className="size-5 text-primary" /><CardTitle>QR Code</CardTitle></CardHeader><CardContent className="text-sm leading-relaxed text-muted-foreground">Le QR Code identifie une carte adhérent ou un livre. Il peut être affiché depuis le tableau de bord ou téléchargé sur téléphone.</CardContent></Card>
      <Card><CardHeader><ScanLine className="size-5 text-primary" /><CardTitle>Scanner</CardTitle></CardHeader><CardContent className="text-sm leading-relaxed text-muted-foreground">Le personnel peut scanner un QR Code ou un code-barres avec une caméra compatible HTTPS, ou saisir son contenu manuellement.</CardContent></Card>
      <Card><CardHeader><ShieldCheck className="size-5 text-primary" /><CardTitle>Compte sécurisé</CardTitle></CardHeader><CardContent className="text-sm leading-relaxed text-muted-foreground">Utilisez Mon profil pour vos informations et le menu de compte pour gérer votre accès. Ne partagez jamais votre mot de passe.</CardContent></Card>
    </div>
    {isReader && <Card className="border-primary/20 bg-primary/5"><CardContent className="flex gap-3 py-5"><UserRoundCheck className="mt-0.5 size-5 shrink-0 text-primary" /><p className="text-sm leading-relaxed">Astuce : votre espace personnel permet de consulter vos emprunts, réserver un livre indisponible, télécharger votre carte et retrouver votre historique.</p></CardContent></Card>}
    {!isReader && <Card className="border-primary/20 bg-primary/5"><CardContent className="flex gap-3 py-5"><BookOpen className="mt-0.5 size-5 shrink-0 text-primary" /><p className="text-sm leading-relaxed">Astuce : chargez toujours les couvertures, logos et portraits une fois Cloudinary configuré : les fichiers restent alors disponibles même après un redémarrage de Render.</p></CardContent></Card>}
  </div>;
}
