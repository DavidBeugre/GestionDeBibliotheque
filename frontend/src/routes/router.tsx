import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import RoleGuard from '@/routes/RoleGuard';
import { RouteErrorBoundary } from '@/components/ErrorBoundary';

import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import ComingSoonPage from '@/pages/ComingSoonPage';
import BooksListPage from '@/pages/books/BooksListPage';
import BookDetailPage from '@/pages/books/BookDetailPage';
import MembersListPage from '@/pages/members/MembersListPage';
import MemberDetailPage from '@/pages/members/MemberDetailPage';
import BorrowsListPage from '@/pages/borrows/BorrowsListPage';
import ReservationsListPage from '@/pages/reservations/ReservationsListPage';
import FinesListPage from '@/pages/fines/FinesListPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import NotFoundPage from '@/pages/errors/NotFoundPage';
import ForbiddenPage from '@/pages/errors/ForbiddenPage';
import ServerErrorPage from '@/pages/errors/ServerErrorPage';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/profile', element: <ComingSoonPage title="Mon profil" step="Étape 9 (finalisation)" /> },

          {
            element: <RoleGuard allowedRoles={['ADMIN', 'LIBRARIAN']} />,
            children: [
              { path: '/books', element: <BooksListPage /> },
              { path: '/books/:id', element: <BookDetailPage /> },
              { path: '/members', element: <MembersListPage /> },
              { path: '/members/:id', element: <MemberDetailPage /> },
              { path: '/borrows', element: <BorrowsListPage /> },
              { path: '/reservations', element: <ReservationsListPage /> },
              { path: '/fines', element: <FinesListPage /> },
              { path: '/reports', element: <ReportsPage /> },
            ],
          },
          {
            element: <RoleGuard allowedRoles={['ADMIN']} />,
            children: [{ path: '/settings', element: <SettingsPage /> }],
          },
        ],
      },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
