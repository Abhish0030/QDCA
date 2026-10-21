import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  clearAuthenticatedSessionCache,
  getCachedAuthenticatedSession,
  getCurrentSession,
  waitForAuthenticatedSession,
} from '../lib/authClient.js';
import PageLoader from './PageLoader.jsx';
import RouteErrorState from './RouteErrorState.jsx';

const SESSION_RESOLUTION_TIMEOUT_MS = 10000;

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(() => getCachedAuthenticatedSession() ?? undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setError(new Error('Session resolution timed out.'));
        setSession(null);
      }
    }, SESSION_RESOLUTION_TIMEOUT_MS);

    async function resolveSession() {
      try {
        const currentSession = await getCurrentSession({ preserveCachedOnError: true });
        const resolvedSession = currentSession?.user?.id
          ? currentSession
          : await waitForAuthenticatedSession({ attempts: 2, delayMs: 250, preserveCachedOnError: true });

        if (!cancelled) {
          setError(null);
          setSession(resolvedSession || null);
        }
      } catch (nextError) {
        if (!cancelled) {
          const cachedSession = getCachedAuthenticatedSession();
          if (cachedSession?.user?.id) {
            setError(null);
            setSession(cachedSession);
          } else {
            setError(nextError);
            setSession(null);
            clearAuthenticatedSessionCache();
          }
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    resolveSession();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (session === undefined) {
    return <PageLoader />;
  }

  if (error) {
    return <RouteErrorState message={error.message || 'Session verification failed before the dashboard could load.'} />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.user?.status && session.user.status !== 'active') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
