import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BookCopy, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { catalogService } from '@/services/catalog.service';
import { queryKeys } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { Category, Publisher } from '@/types';

export default function CatalogSettingsPage() {
  const client = useQueryClient();
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#2563eb');
  const [publisherName, setPublisherName] = useState('');
  const [publisherCountry, setPublisherCountry] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);
  const categories = useQuery({ queryKey: queryKeys.categories, queryFn: catalogService.listCategories });
  const publishers = useQuery({ queryKey: queryKeys.publishers, queryFn: catalogService.listPublishers });
  const refreshCategories = () => client.invalidateQueries({ queryKey: queryKeys.categories });
  const refreshPublishers = () => client.invalidateQueries({ queryKey: queryKeys.publishers });

  const categoryMutation = useMutation({
    mutationFn: () => editingCategory
      ? catalogService.updateCategory(editingCategory.id, { name: categoryName.trim(), color: categoryColor })
      : catalogService.createCategory({ name: categoryName.trim(), color: categoryColor }),
    onSuccess: () => { refreshCategories(); setCategoryName(''); setCategoryColor('#2563eb'); setEditingCategory(null); toast.success('Catégorie enregistrée'); },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible d’enregistrer la catégorie')),
  });
  const publisherMutation = useMutation({
    mutationFn: () => editingPublisher
      ? catalogService.updatePublisher(editingPublisher.id, { name: publisherName.trim(), country: publisherCountry.trim() || undefined })
      : catalogService.createPublisher({ name: publisherName.trim(), country: publisherCountry.trim() || undefined }),
    onSuccess: () => { refreshPublishers(); setPublisherName(''); setPublisherCountry(''); setEditingPublisher(null); toast.success('Éditeur enregistré'); },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible d’enregistrer l’éditeur')),
  });
  const removeCategory = useMutation({ mutationFn: catalogService.removeCategory, onSuccess: () => { refreshCategories(); toast.success('Catégorie supprimée'); }, onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de supprimer cette catégorie')) });
  const removePublisher = useMutation({ mutationFn: catalogService.removePublisher, onSuccess: () => { refreshPublishers(); toast.success('Éditeur supprimé'); }, onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de supprimer cet éditeur')) });

  return <div className="space-y-6">
    <div><h1 className="font-display text-2xl font-semibold">Référentiel du catalogue</h1><p className="text-sm text-muted-foreground">Gérez les catégories et les éditeurs proposés lors de la création d’un livre.</p></div>
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="space-y-4 p-4"><div className="flex items-center gap-2"><Tags className="size-5 text-primary" /><h2 className="font-display text-lg font-semibold">Catégories</h2></div>
        <div className="grid gap-2 sm:grid-cols-[1fr_52px_auto]"><Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Nom de la catégorie" /><Input aria-label="Couleur" type="color" value={categoryColor} onChange={(event) => setCategoryColor(event.target.value)} className="h-10 p-1" /><Button onClick={() => categoryName.trim() ? categoryMutation.mutate() : toast.error('Le nom est requis')} isLoading={categoryMutation.isPending}>{editingCategory ? 'Enregistrer' : <><Plus className="size-4" /> Ajouter</>}</Button></div>
        {editingCategory && <Button variant="ghost" size="sm" onClick={() => { setEditingCategory(null); setCategoryName(''); }}>Annuler la modification</Button>}
        <div className="space-y-2">{categories.data?.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-md border p-3"><span className="size-3 rounded-full" style={{ backgroundColor: item.color || '#64748b' }} /><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span><Button size="icon" variant="ghost" aria-label={`Modifier ${item.name}`} onClick={() => { setEditingCategory(item); setCategoryName(item.name); setCategoryColor(item.color || '#2563eb'); }}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" aria-label={`Supprimer ${item.name}`} onClick={() => window.confirm(`Supprimer ${item.name} ?`) && removeCategory.mutate(item.id)}><Trash2 className="size-4 text-destructive" /></Button></div>)}</div>
      </Card>
      <Card className="space-y-4 p-4"><div className="flex items-center gap-2"><BookCopy className="size-5 text-primary" /><h2 className="font-display text-lg font-semibold">Éditeurs</h2></div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><Input value={publisherName} onChange={(event) => setPublisherName(event.target.value)} placeholder="Nom de l’éditeur" /><Input value={publisherCountry} onChange={(event) => setPublisherCountry(event.target.value)} placeholder="Pays (facultatif)" /><Button onClick={() => publisherName.trim() ? publisherMutation.mutate() : toast.error('Le nom est requis')} isLoading={publisherMutation.isPending}>{editingPublisher ? 'Enregistrer' : <><Plus className="size-4" /> Ajouter</>}</Button></div>
        {editingPublisher && <Button variant="ghost" size="sm" onClick={() => { setEditingPublisher(null); setPublisherName(''); setPublisherCountry(''); }}>Annuler la modification</Button>}
        <div className="space-y-2">{publishers.data?.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-md border p-3"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.name}</span><span className="block truncate text-xs text-muted-foreground">{item.country || 'Pays non renseigné'}</span></span><Button size="icon" variant="ghost" aria-label={`Modifier ${item.name}`} onClick={() => { setEditingPublisher(item); setPublisherName(item.name); setPublisherCountry(item.country || ''); }}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" aria-label={`Supprimer ${item.name}`} onClick={() => window.confirm(`Supprimer ${item.name} ?`) && removePublisher.mutate(item.id)}><Trash2 className="size-4 text-destructive" /></Button></div>)}</div>
      </Card>
    </div>
  </div>;
}
