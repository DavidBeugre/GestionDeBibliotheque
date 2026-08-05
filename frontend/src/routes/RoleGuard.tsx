import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { RoleName } from '@/types';

export default function RoleGuard({ allowedRoles }: { allowedRoles: RoleName[] }) {
  const { hasRole } = useAuth();

  if (!hasRole(...allowedRoles)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
