import { Loader2 } from 'lucide-react';

function PageLoader() {
  return (
    <main className="min-h-screen bg-qdca-bg flex items-center justify-center p-6" aria-busy="true">
      <div className="glass-shadow flex items-center gap-3 rounded-2xl bg-white px-8 py-6 text-qdca-purple">
        <Loader2 size={22} className="animate-spin" aria-hidden="true" />
        <span className="text-sm font-semibold">Loading</span>
      </div>
    </main>
  );
}

export default PageLoader;
