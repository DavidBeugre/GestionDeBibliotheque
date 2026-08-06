import { Outlet } from 'react-router-dom';
import { Library } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Library className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold">Shelfly</h1>
            <p className="text-sm text-muted-foreground">Système de gestion documentaire</p>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
