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
import ScannerPage from '@/pages/ScannerPage';
import ProfilePage from '@/pages/ProfilePage';
import MemberCatalogPage from '@/pages/MemberCatalogPage';
import MemberHistoryPage from '@/pages/MemberHistoryPage';
import AuthorsPage from '@/pages/AuthorsPage';

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
          { path: '/profile', element: <ProfilePage /> },
          { path: '/catalogue', element: <MemberCatalogPage /> },
          { path: '/my-history', element: <MemberHistoryPage /> },

          {
            element: <RoleGuard allowedRoles={['ADMIN', 'LIBRARIAN']} />,
            children: [
              { path: '/books', element: <BooksListPage /> },
              { path: '/books/:id', element: <BookDetailPage /> },
              { path: '/authors', element: <AuthorsPage /> },
              { path: '/members', element: <MembersListPage /> },
              { path: '/members/:id', element: <MemberDetailPage /> },
              { path: '/borrows', element: <BorrowsListPage /> },
              { path: '/reservations', element: <ReservationsListPage /> },
              { path: '/fines', element: <FinesListPage /> },
              { path: '/reports', element: <ReportsPage /> },
              { path: '/scanner', element: <ScannerPage /> },
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
