import { BookOpen, Users, Clock3, AlertTriangle, Moon, Sun, Search, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

const colorTokens = [
  { name: 'primary', label: 'Primaire — vert lampe', className: 'bg-primary' },
  { name: 'accent', label: 'Accent — laiton', className: 'bg-accent' },
  { name: 'secondary', label: 'Secondaire', className: 'bg-secondary' },
  { name: 'success', label: 'Succès', className: 'bg-success' },
  { name: 'warning', label: 'Alerte', className: 'bg-warning' },
  { name: 'destructive', label: 'Erreur', className: 'bg-destructive' },
];

const statCards = [
  { label: 'Livres au catalogue', value: '12 480', icon: BookOpen, spine: 'default' as const },
  { label: 'Adhérents actifs', value: '3 214', icon: Users, spine: 'default' as const },
  { label: 'Emprunts en cours', value: '842', icon: Clock3, spine: 'accent' as const },
  { label: 'Retours en retard', value: '37', icon: AlertTriangle, spine: 'accent' as const },
];

export default function StyleGuidePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Library className="size-4" />
            </div>
            <span className="font-display text-base font-semibold">Bibliothèque — Design System</span>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Changer de thème">
            {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
        </div>
      </header>

      <main className="container space-y-14 py-12">
        <section className="max-w-2xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Étape 8 — Fondations</p>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Un système visuel pensé pour la vie quotidienne d'une bibliothèque.
          </h1>
          <p className="text-muted-foreground">
            Vite, React 19, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Framer Motion et
            React Hot Toast sont connectés. Cette page sert de référence visuelle pour les prochaines étapes
            (authentification, dashboard, catalogue, adhérents...).
          </p>
        </section>

        {/* Palette */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Palette</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {colorTokens.map((token) => (
              <div key={token.name} className="space-y-2">
                <div className={`h-16 rounded-lg border border-border shadow-xs ${token.className}`} />
                <p className="text-xs text-muted-foreground">{token.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Typographie */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Typographie</h2>
          <Card>
            <CardContent className="space-y-4 pt-5">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Titrage — Source Serif 4</p>
                <p className="font-display text-3xl font-semibold">Fiche livre : Les Soleils des indépendances</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Interface — Inter</p>
                <p className="text-base">
                  Empruntable jusqu'au 14 août. Ahmadou Kourouma — Éditions Nouvelle Plume, 1968.
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Données — JetBrains Mono (cotes, ISBN, montants)</p>
                <p className="font-data text-base">ROM-KOU-001 · ISBN 978-2-07-036822-8 · 2 500 XOF</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Boutons */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Boutons</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Enregistrer l'emprunt</Button>
            <Button variant="secondary">Renouveler</Button>
            <Button variant="outline">Annuler</Button>
            <Button variant="destructive">Supprimer</Button>
            <Button variant="ghost">Ignorer</Button>
            <Button variant="link">Voir le détail</Button>
            <Button isLoading>Traitement…</Button>
            <Button size="icon" variant="outline" aria-label="Rechercher">
              <Search className="size-4" />
            </Button>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Statuts</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">Disponible</Badge>
            <Badge variant="warning">En retard</Badge>
            <Badge variant="destructive">Perdu</Badge>
            <Badge variant="accent">Réservé</Badge>
            <Badge variant="secondary">Archivé</Badge>
            <Badge variant="outline">Brouillon</Badge>
          </div>
        </section>

        {/* Formulaire */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Champs de formulaire</h2>
          <Card className="max-w-md">
            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <Label htmlFor="demo-email">Adresse email</Label>
                <Input id="demo-email" type="email" placeholder="adherent@bibliotheque.ci" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-error">Numéro d'inventaire</Label>
                <Input id="demo-error" error defaultValue="INV-000042" />
                <p className="text-xs text-destructive">Ce numéro d'inventaire est déjà utilisé.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cartes statistiques — élément signature "tranche de livre" */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Cartes statistiques (élément signature)</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Un fin liseré coloré sur le bord gauche, clin d'œil aux dos de livres alignés sur une étagère —
            utilisé sur les cartes de tableau de bord et l'élément de navigation actif.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map(({ label, value, icon: Icon, spine }) => (
              <Card key={label} className={`card-spine ${spine === 'accent' ? 'card-spine-accent' : ''} pl-1`}>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>{label}</CardDescription>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="font-data text-2xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Skeleton */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">État de chargement</h2>
          <Card className="max-w-sm">
            <CardHeader>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
