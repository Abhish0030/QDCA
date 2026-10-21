import { useEffect, useState } from "react";
import { MoreVertical, FileText } from "lucide-react";
import { fetchClassifications } from "../api";
import { diffBadge, srcBadge } from "../data";
import DashboardEmptyState from "./DashboardEmptyState";
import { readSessionCache, writeSessionCache } from "../utils/cache";

export default function RecentClassifications({ refreshKey = 0, onPrimaryAction }) {
  const [rows, setRows]         = useState(() => readSessionCache("qdca:dashboard:recent-classifications") || []);
  const [loading, setLoading]   = useState(() => !readSessionCache("qdca:dashboard:recent-classifications"));
  const [showAll, setShowAll]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetchClassifications()
      .then(data => {
        setError("");
        setRows(data);
        writeSessionCache("qdca:dashboard:recent-classifications", data);
      })
      .catch(() => {
        const fallbackRows = readSessionCache("qdca:dashboard:recent-classifications") || [];
        setRows(fallbackRows);
        setError("Couldn't load recent classifications right now. Try refreshing in a moment.");
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const visibleRows = showAll ? rows : rows.slice(0, 5);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Classifications</h3>
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
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : visibleRows.length === 0 ? (
          <DashboardEmptyState
            title="No recent activity yet."
            description="Your recent classifications will appear here once you analyze your first question."
            onAction={onPrimaryAction}
          />
        ) : (
          <div className="space-y-3 p-4">
            {visibleRows.map((row, i) => (
              <article key={row.id ?? i} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-6 text-gray-800">{typeof row?.question === "string" ? row.question : String(row?.question ?? "")}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${srcBadge[row?.source] || "bg-gray-100 text-gray-600"}`}>{typeof row?.source === "string" ? row.source : String(row?.source ?? "")}</span>
                      <span className={`inline-flex min-h-6 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${diffBadge[row?.difficulty] || "bg-gray-100 text-gray-600"}`}>{typeof row?.difficulty === "string" ? row.difficulty : String(row?.difficulty ?? "")}</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-gray-400">Confidence</span>
                        <span className="text-xs font-semibold text-gray-700">{Number(row?.conf ?? 0)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: `${Number(row?.conf ?? 0)}%` }} />
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-medium text-gray-400">{typeof row?.date === "string" ? row.date : String(row?.date ?? "")}</p>
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
              {["Question", "Source", "Difficulty", "Confidence", "Analyzed At", ""].map((h, i) => (
                <th key={i} className={`px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap ${i === 2 ? "min-w-[108px]" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr className="border-t border-red-100 bg-red-50/70">
                <td colSpan={6} className="px-5 py-3 text-sm font-medium text-red-600">
                  {error}
                </td>
              </tr>
            ) : null}
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : visibleRows.length === 0 ? (
                  <tr className="border-t border-gray-50">
                    <td colSpan={6} className="p-0">
                      <DashboardEmptyState
                        title="No recent activity yet."
                        description="Your recent classifications will appear here once you analyze your first question."
                        onAction={onPrimaryAction}
                      />
                    </td>
                  </tr>
                )
              : visibleRows.map((row, i) => (
              <tr key={row.id ?? i} className="group border-t border-gray-50 transition-colors hover:bg-purple-50/30">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      <FileText className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="max-w-[220px] truncate text-sm font-medium leading-6 text-gray-700" title={String(row?.question ?? "")}>{typeof row?.question === "string" ? row.question : String(row?.question ?? "")}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${srcBadge[row?.source] || "bg-gray-100 text-gray-600"}`}>{typeof row?.source === "string" ? row.source : String(row?.source ?? "")}</span>
                </td>
                <td className="min-w-[108px] px-5 py-3.5">
                  <span className={`inline-flex min-h-6 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${diffBadge[row?.difficulty] || "bg-gray-100 text-gray-600"}`}>{typeof row?.difficulty === "string" ? row.difficulty : String(row?.difficulty ?? "")}</span>
                </td>
                <td className="min-w-[120px] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${Number(row?.conf ?? 0)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-8 text-right">{Number(row?.conf ?? 0)}%</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium text-gray-400">{typeof row?.date === "string" ? row.date : String(row?.date ?? "")}</td>
                <td className="px-5 py-3.5">
                  <button className="text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-4 text-center sm:px-6">
        {rows.length > 5 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-sm font-semibold text-purple-600 transition-colors hover:text-purple-700"
          >
            {showAll ? "Show Less" : `View All Classifications (${rows.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
