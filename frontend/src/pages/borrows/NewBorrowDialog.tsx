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
import { borrowService } from '@/services/borrow.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import type { Book, Member } from '@/types';

interface NewBorrowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewBorrowDialog({ open, onOpenChange }: NewBorrowDialogProps) {
  const queryClient = useQueryClient();
  const [member, setMember] = useState<Member | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [copyId, setCopyId] = useState<string | null>(null);

  const availableCopies = book?.copies.filter((c) => c.status === 'AVAILABLE') ?? [];

  const mutation = useMutation({
    mutationFn: () => borrowService.create({ memberId: member!.id, bookCopyId: copyId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrows'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Emprunt enregistré avec succès');
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Impossible d'enregistrer l'emprunt")),
  });

  function reset() {
    setMember(null);
    setBook(null);
    setCopyId(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel emprunt</DialogTitle>
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
                    <AvatarFallback className="text-[10px]">{m.user.firstName?.[0]}{m.user.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  <span>
                    {m.user.firstName} {m.user.lastName} <span className="text-muted-foreground">· {m.matricule}</span>
                  </span>
                </span>
              )}
              renderSelected={(m) => (
                <span className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  {m.user.firstName} {m.user.lastName} ({m.matricule})
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
              onSelect={(b) => {
                setBook(b);
                setCopyId(null);
              }}
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
          </div>

          {book && (
            <div className="space-y-1.5">
              <Label>Exemplaire</Label>
              {availableCopies.length === 0 ? (
                <p className="text-xs text-destructive">Aucun exemplaire disponible pour ce livre.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableCopies.map((copy) => (
                    <button
                      key={copy.id}
                      type="button"
                      onClick={() => setCopyId(copy.id)}
                      className={`font-data rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        copyId === copy.id ? 'border-primary bg-primary-50 text-primary' : 'border-input hover:bg-muted'
                      }`}
                    >
                      {copy.inventoryNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button disabled={!member || !copyId} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>
            Enregistrer l'emprunt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
