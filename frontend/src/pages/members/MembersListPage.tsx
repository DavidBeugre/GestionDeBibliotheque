import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MoreHorizontal, Plus, Search, ShieldOff, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { memberService } from '@/services/member.service';
import { queryKeys, PERMISSIONS } from '@/constants';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { MEMBER_STATUS_CONFIG, MEMBER_TYPE_LABELS } from '@/utils/statusConfig';
import type { Member } from '@/types';
import { MemberFormDialog } from './MemberFormDialog';

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export default function MembersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [memberType, setMemberType] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const canManage = hasPermission(PERMISSIONS.MEMBER_MANAGE);

  const params = { page, limit: 12, search: debouncedSearch || undefined, status, memberType };
  const membersQuery = useQuery({
    queryKey: queryKeys.members(params),
    queryFn: () => memberService.list(params),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'suspend' | 'reactivate' }) =>
      action === 'suspend' ? memberService.suspend(id) : memberService.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Statut mis à jour');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de mettre à jour le statut')),
  });

  const members = membersQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Adhérents</h1>
          <p className="text-sm text-muted-foreground">{membersQuery.data?.meta.total ?? 0} adhérents enregistrés</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditingMember(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Nouvel adhérent
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nom, email, matricule…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? undefined : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tous statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {Object.entries(MEMBER_STATUS_CONFIG).map(([value, cfg]) => (
                <SelectItem key={value} value={value}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={memberType} onValueChange={(v) => { setMemberType(v === 'all' ? undefined : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tous types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {Object.entries(MEMBER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        {membersQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun adhérent trouvé"
            description="Essayez d'ajuster votre recherche ou vos filtres."
            action={canManage ? { label: 'Ajouter un adhérent', onClick: () => setFormOpen(true) } : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adhérent</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="cursor-pointer" onClick={() => navigate(`/members/${member.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={member.user.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">{initials(member.user.firstName, member.user.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-data text-sm">{member.matricule}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{MEMBER_TYPE_LABELS[member.memberType] ?? member.memberType}</TableCell>
                  <TableCell>
                    <Badge variant={MEMBER_STATUS_CONFIG[member.status]?.variant}>{MEMBER_STATUS_CONFIG[member.status]?.label}</Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/members/${member.id}`)}>Voir le profil</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMember(member);
                              setFormOpen(true);
                            }}
                          >
                            Modifier
                          </DropdownMenuItem>
                          {member.status === 'ACTIVE' ? (
                            <DropdownMenuItem
                              destructive
                              onClick={() => toggleStatusMutation.mutate({ id: member.id, action: 'suspend' })}
                            >
                              <ShieldOff className="size-3.5" /> Suspendre
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => toggleStatusMutation.mutate({ id: member.id, action: 'reactivate' })}>
                              <ShieldCheck className="size-3.5" /> Réactiver
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {membersQuery.data && <Pagination meta={membersQuery.data.meta} onPageChange={setPage} />}
      </Card>

      <MemberFormDialog open={formOpen} onOpenChange={setFormOpen} member={editingMember} />
    </div>
  );
}
