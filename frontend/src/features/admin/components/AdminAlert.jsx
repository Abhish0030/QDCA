import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function AdminAlert({
  title = "Something went wrong",
  message,
  onRetry,
  tone = "error",
  className = "",
}) {
  const toneClassName =
    tone === "error"
      ? "border-[#FFD7DE] bg-[#FFF4F6] text-[#8A1730]"
      : "border-[#FFE2E8] bg-[#FFF8FA] text-[#6B7280]";

  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-sm ${toneClassName} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/80">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {message ? <p className="mt-1 text-sm leading-6">{message}</p> : null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white px-3 py-2 text-xs font-semibold text-[#FF385C] transition-colors hover:bg-[#FFF1F4]"
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
