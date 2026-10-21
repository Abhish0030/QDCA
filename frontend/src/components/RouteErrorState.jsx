import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

function RouteErrorState({
  title = 'We could not verify your session.',
  message = 'Please sign in again or retry once the backend is reachable.',
}) {
  return (
    <main className="min-h-screen bg-qdca-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">{message}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-2xl bg-qdca-purple px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-110"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
          <Link
            to="/login"
            className="inline-flex items-center rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Go To Login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default RouteErrorState;
