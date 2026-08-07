import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/common/EmptyState';
import { catalogService } from '@/services/catalog.service';
import { queryKeys } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { Author } from '@/types';

export default function AuthorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [editing, setEditing] = useState<Author | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [authorForPhoto, setAuthorForPhoto] = useState<string | null>(null);

  const authorsQuery = useQuery({ queryKey: queryKeys.authors(), queryFn: () => catalogService.listAuthors() });
  const authors = useMemo(() => (authorsQuery.data ?? []).filter((author) => author.name.toLowerCase().includes(search.toLowerCase())), [authorsQuery.data, search]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.authors() });

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? catalogService.updateAuthor(editing.id, { name: name.trim(), nationality: nationality.trim() || undefined })
      : catalogService.createAuthor({ name: name.trim(), nationality: nationality.trim() || undefined }),
    onSuccess: () => {
      refresh();
      setName('');
      setNationality('');
      setEditing(null);
      toast.success(editing ? 'Auteur mis à jour' : 'Auteur ajouté');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'enregistrer cet auteur")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => catalogService.removeAuthor(id),
    onSuccess: () => {
      refresh();
      toast.success('Auteur supprimé');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible de supprimer cet auteur")),
  });
  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => catalogService.uploadAuthorPhoto(id, file),
    onSuccess: () => { refresh(); toast.success('Photo de l’auteur mise à jour'); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'envoyer cette photo")),
  });

  const submit = () => {
    if (!name.trim()) return toast.error("Le nom de l'auteur est requis");
    saveMutation.mutate();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Auteurs</h1>
        <p className="text-sm text-muted-foreground">Ajoutez, corrigez et organisez les auteurs du catalogue.</p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom de l'auteur" />
          <Input value={nationality} onChange={(event) => setNationality(event.target.value)} placeholder="Nationalité (facultatif)" />
          <Button onClick={submit} isLoading={saveMutation.isPending}>
            {editing ? <Pencil className="size-4" /> : <Plus className="size-4" />}
            {editing ? 'Enregistrer' : 'Ajouter'}
          </Button>
          {editing && <Button variant="outline" onClick={() => { setEditing(null); setName(''); setNationality(''); }}>Annuler</Button>}
        </div>
      </Card>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Rechercher un auteur" />
      </div>

      {authorsQuery.isLoading ? <p className="text-sm text-muted-foreground">Chargement des auteurs…</p> : authors.length === 0 ? (
        <EmptyState icon={Users} title="Aucun auteur trouvé" description="Ajoutez le premier auteur du catalogue." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <Card key={author.id} className="flex items-center gap-3 p-4">
              {author.photoUrl ? <img src={author.photoUrl} alt={author.name} className="size-10 shrink-0 rounded-full object-cover" /> : <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{author.name.charAt(0).toUpperCase()}</div>}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{author.name}</p>
                <p className="truncate text-xs text-muted-foreground">{author.nationality || 'Nationalité non renseignée'}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" aria-label={`Ajouter une photo pour ${author.name}`} onClick={() => { setAuthorForPhoto(author.id); photoInputRef.current?.click(); }} isLoading={photoMutation.isPending && authorForPhoto === author.id}><Camera className="size-4" /></Button>
                <Button size="icon" variant="ghost" aria-label={`Modifier ${author.name}`} onClick={() => { setEditing(author); setName(author.name); setNationality(author.nationality ?? ''); }}><Pencil className="size-4" /></Button>
                <Button size="icon" variant="ghost" aria-label={`Supprimer ${author.name}`} onClick={() => { if (window.confirm(`Supprimer ${author.name} ?`)) deleteMutation.mutate(author.id); }} isLoading={deleteMutation.isPending}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file && authorForPhoto) photoMutation.mutate({ id: authorForPhoto, file }); event.target.value = ''; }} />
    </div>
  );
}
