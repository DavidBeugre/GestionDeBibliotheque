import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/services/apiClient';
import type { ApiSuccessResponse } from '@/types';
type ManagedUser = { id: string; email: string; firstName: string; lastName: string; isActive: boolean; role: { name: 'ADMIN' | 'LIBRARIAN' | 'READER' } };

export default function UsersPage() {
  const client = useQueryClient();
  const users = useQuery({ queryKey: ['users'], queryFn: async () => (await apiClient.get<ApiSuccessResponse<ManagedUser[]>>('/users', { params: { limit: 100 } })).data.data });
  const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<{ role: ManagedUser['role']['name']; isActive: boolean }> }) => apiClient.patch(`/users/${id}`, data), onSuccess: () => { client.invalidateQueries({ queryKey: ['users'] }); toast.success('Compte mis à jour'); }, onError: () => toast.error('Impossible de modifier ce compte') });
  return <div className="space-y-5"><div><h1 className="font-display text-2xl font-semibold">Utilisateurs</h1><p className="text-sm text-muted-foreground">Gérez les rôles et l’accès des comptes Shelfly.</p></div><Card className="overflow-hidden"><div className="divide-y">{users.isLoading ? <p className="p-5 text-sm text-muted-foreground">Chargement…</p> : users.data?.map((user) => <div key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><UserCog className="size-5 text-primary" /><div><p className="font-medium">{user.firstName} {user.lastName}</p><p className="text-xs text-muted-foreground">{user.email}</p></div></div><Select value={user.role.name} onValueChange={(role) => update.mutate({ id: user.id, data: { role: role as ManagedUser['role']['name'] } })}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ADMIN">Administrateur</SelectItem><SelectItem value="LIBRARIAN">Bibliothécaire</SelectItem><SelectItem value="READER">Adhérent</SelectItem></SelectContent></Select><Button size="sm" variant={user.isActive ? 'outline' : 'default'} onClick={() => update.mutate({ id: user.id, data: { isActive: !user.isActive } })}>{user.isActive ? 'Désactiver' : 'Activer'}</Button></div>)}</div></Card></div>;
}
