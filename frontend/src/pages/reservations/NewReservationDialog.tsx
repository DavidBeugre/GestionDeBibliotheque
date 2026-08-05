import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BookOpen, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AsyncSearchField } from '@/components/common/AsyncSearchField';
import { memberService } from '@/services/member.service';
import { bookService } from '@/services/book.service';
import { reservationService } from '@/services/reservation.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { Book, Member } from '@/types';

export function NewReservationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [member, setMember] = useState<Member | null>(null);
  const [book, setBook] = useState<Book | null>(null);

  function reset() {
    setMember(null);
    setBook(null);
  }

  const mutation = useMutation({
    mutationFn: () => reservationService.create({ memberId: member!.id, bookId: book!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Réservation créée avec succès');
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Impossible de créer la réservation')),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle réservation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Adhérent</Label>
            <AsyncSearchField<Member>
              placeholder="Rechercher un adhérent…"
              search={(q) => memberService.list({ search: q, limit: 8 }).then((r) => r.items)}
              getKey={(m) => m.id}
              selected={member}
              onSelect={setMember}
              renderItem={(m) => (
                <span className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px]">{m.user.firstName[0]}{m.user.lastName[0]}</AvatarFallback>
                  </Avatar>
                  {m.user.firstName} {m.user.lastName}
                </span>
              )}
              renderSelected={(m) => (
                <span className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  {m.user.firstName} {m.user.lastName}
                </span>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Livre</Label>
            <AsyncSearchField<Book>
              placeholder="Rechercher un livre…"
              search={(q) => bookService.list({ search: q, limit: 8 }).then((r) => r.items)}
              getKey={(b) => b.id}
              selected={book}
              onSelect={setBook}
              renderItem={(b) => (
                <span>
                  {b.title} <span className="text-muted-foreground">· {b.availableCopies} dispo.</span>
                </span>
              )}
              renderSelected={(b) => (
                <span className="flex items-center gap-2">
                  <BookOpen className="size-4 text-muted-foreground" />
                  {b.title}
                </span>
              )}
            />
            {book && book.availableCopies > 0 && (
              <p className="text-xs text-warning-foreground">
                Un exemplaire est actuellement disponible — la réservation sera refusée, un emprunt direct est préférable.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button disabled={!member || !book} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Créer la réservation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
