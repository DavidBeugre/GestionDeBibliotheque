import { Library, QrCode as QrCodeIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MEMBER_TYPE_LABELS } from '@/utils/statusConfig';
import { API_BASE_URL } from '@/constants';
import type { Member } from '@/types';

function initials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

function resolveMediaUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if ((value.startsWith('/uploads/') || /\/uploads\//i.test(value)) && !import.meta.env.DEV) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  // Les anciens enregistrements ne contiennent parfois qu'un nom de fichier.
  // Leur fichier local n'existe plus sur Render après un redéploiement.
  if (!value.startsWith('/')) return undefined;

  const apiOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${apiOrigin}${value}`;
}

export function MembershipCard({ member, qrCodeUrl }: { member: Member; qrCodeUrl?: string | null }) {
  return (
    <div className="relative aspect-[85.6/54] w-full max-w-xs overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Library className="size-4" />
          <span className="font-display text-xs font-semibold">Shelfly</span>
        </div>
        <span className="text-[10px] uppercase tracking-wide opacity-80">
          {MEMBER_TYPE_LABELS[member.memberType] ?? member.memberType}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Avatar className="size-12 border-2 border-white/40">
          <AvatarImage src={resolveMediaUrl(member.user.avatarUrl)} />
          <AvatarFallback className="bg-white/20 text-primary-foreground">
            {initials(member.user.firstName, member.user.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {member.user.firstName} {member.user.lastName}
          </p>
          <p className="font-data text-xs opacity-80">{member.matricule}</p>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-md bg-white/95">
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="QR Code adhérent" className="size-10 object-contain" />
        ) : (
          <QrCodeIcon className="size-6 text-primary" />
        )}
      </div>

      <p className="absolute bottom-4 left-4 font-data text-[10px] opacity-70">
        {member.cardNumber ?? '—'}
      </p>
    </div>
  );
}
