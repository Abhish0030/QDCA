import { Loader2 } from "lucide-react";
import AdminAlert from "./AdminAlert.jsx";

export function AdminPageLoading({ label = "Loading admin data..." }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-100 bg-white px-6 py-10 shadow-sm">
      <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin text-[#FF385C]" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function AdminPageError({ title, message, onRetry }) {
  return <AdminAlert title={title} message={message} onRetry={onRetry} className="bg-white" />;
}
