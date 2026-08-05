import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import ServerErrorPage from '@/pages/errors/ServerErrorPage';
import NotFoundPage from '@/pages/errors/NotFoundPage';

/** Utilisé comme errorElement des routes React Router (erreurs de chargement/rendu de route). */
export function RouteErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }
  return <ServerErrorPage />;
}

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Filet de sécurité global pour les erreurs de rendu React en dehors du cycle de vie du routeur. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Erreur non gérée capturée par ErrorBoundary :', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ServerErrorPage />;
    }
    return this.props.children;
  }
}
