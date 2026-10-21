import { useEffect, useState } from "react";
import { FileText, CheckCircle2, Upload } from "lucide-react";
import { fetchUploads } from "../api";
import DashboardEmptyState from "./DashboardEmptyState";
import { readSessionCache, writeSessionCache } from "../utils/cache";

export default function RecentUploads({ refreshKey = 0, onPrimaryAction }) {
  const [files, setFiles]       = useState(() => readSessionCache("qdca:dashboard:recent-uploads") || []);
  const [loading, setLoading]   = useState(() => !readSessionCache("qdca:dashboard:recent-uploads"));
  const [showAll, setShowAll]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetchUploads()
      .then(data => {
        setError("");
        setFiles(data);
        writeSessionCache("qdca:dashboard:recent-uploads", data);
      })
      .catch(() => {
        const fallbackFiles = readSessionCache("qdca:dashboard:recent-uploads") || [];
        setFiles(fallbackFiles);
        setError("Couldn't load recent uploads right now. Try refreshing in a moment.");
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const visibleFiles = showAll ? files : files.slice(0, 5);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100">
            <Upload className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Uploads</h3>
        </div>
        <button
          onClick={() => setShowAll(v => !v)}
          className="text-sm font-semibold text-purple-600 transition-colors hover:text-purple-700"
        >
          {showAll ? "Show Less" : "View All"}
        </button>
      </div>

      <div className="flex-1 lg:hidden">
        {error ? (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-4">
                <div className="h-4 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : visibleFiles.length === 0 ? (
          <DashboardEmptyState
            title="No recent activity yet."
            description="Your processed document uploads will appear here after you use Doc Analyzer."
            onAction={onPrimaryAction}
          />
        ) : (
          <div className="space-y-3 p-4">
            {visibleFiles.map((file, i) => (
              <article key={file.id ?? i} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
                    <FileText className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-6 text-gray-800">{typeof file?.name === "string" ? file.name : String(file?.name ?? "")}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">{Number(file?.questions ?? 0)} extracted</span>
                      {Number(file?.classifiedQuestions ?? 0) > 0 && (
                        <span className="text-xs text-gray-500">{Number(file?.classifiedQuestions ?? 0)} classified</span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        {typeof file?.status === "string" && file.status.trim() ? file.status : "Completed"}
                      </span>
                      <span className="text-xs font-medium text-gray-400">{typeof file?.date === "string" ? file.date : String(file?.date ?? "")}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="hidden flex-1 overflow-x-auto lg:block">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/70">
              {["File Name", "Questions", "Uploaded At", "Status"].map((h, i) => (
                <th key={i} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr className="border-t border-red-100 bg-red-50/70">
                <td colSpan={4} className="px-5 py-3 text-sm font-medium text-red-600">
                  {error}
                </td>
              </tr>
            ) : null}
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : visibleFiles.length === 0 ? (
                  <tr className="border-t border-gray-50">
                    <td colSpan={4} className="p-0">
                      <DashboardEmptyState
                        title="No recent activity yet."
                        description="Your processed document uploads will appear here after you use Doc Analyzer."
                        onAction={onPrimaryAction}
                      />
                    </td>
                  </tr>
                )
              : visibleFiles.map((file, i) => (
              <tr key={file.id ?? i} className="border-t border-gray-50 transition-colors hover:bg-purple-50/30">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
                      <FileText className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="max-w-[210px] truncate text-sm font-medium leading-6 text-gray-700" title={String(file?.name ?? "")}>{typeof file?.name === "string" ? file.name : String(file?.name ?? "")}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">{Number(file?.questions ?? 0)} extracted</span>
                    {Number(file?.classifiedQuestions ?? 0) > 0 && (
                      <span className="mt-0.5 text-xs font-medium text-gray-500">{Number(file?.classifiedQuestions ?? 0)} classified</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium text-gray-400">{typeof file?.date === "string" ? file.date : String(file?.date ?? "")}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    {typeof file?.status === "string" && file.status.trim() ? file.status : "Completed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-4 text-center sm:px-6">
        {files.length > 5 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-sm font-semibold text-purple-600 transition-colors hover:text-purple-700"
          >
            {showAll ? "Show Less" : `View All Uploads (${files.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
