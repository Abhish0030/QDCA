import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  clearAuthenticatedSessionCache,
  getCachedAuthenticatedSession,
  getCurrentSession,
  waitForAuthenticatedSession,
} from '../lib/authClient.js';
import { verifyAdminAccess } from '../api/adminApi.js';
import PageLoader from './PageLoader.jsx';
import RouteErrorState from './RouteErrorState.jsx';

const SESSION_RESOLUTION_TIMEOUT_MS = 10000;

function AdminProtectedRoute({ children }) {
  const [session, setSession] = useState(() => getCachedAuthenticatedSession() ?? undefined);
  const [hasAdminAccess, setHasAdminAccess] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setError(new Error('Session resolution timed out.'));
        setSession(null);
        setHasAdminAccess(false);
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
          if (resolvedSession?.user?.id) {
            const access = await verifyAdminAccess()
              .then(() => true)
              .catch(() => false);

            if (!cancelled) {
              setHasAdminAccess(access);
            }
          } else {
            setHasAdminAccess(false);
          }
        }
      } catch (nextError) {
        if (!cancelled) {
          const cachedSession = getCachedAuthenticatedSession();
          if (cachedSession?.user?.id) {
            setError(null);
            setSession(cachedSession);
            setHasAdminAccess(false);
          } else {
            setError(nextError);
            setSession(null);
            setHasAdminAccess(false);
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

  if (session === undefined || (session?.user?.id && hasAdminAccess === undefined)) {
    return <PageLoader />;
  }

  if (error) {
    return <RouteErrorState title="We could not verify administrator access." message={error.message || 'Admin session verification failed.'} />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAdminAccess || session.user?.status !== 'active') {
    try {
      sessionStorage.setItem('adminAccessDenied', '1');
    } catch {
      // sessionStorage may be unavailable in restricted browser contexts.
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
