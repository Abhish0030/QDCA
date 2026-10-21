import { useEffect, useState } from "react";
import { FileText, Search, Filter } from "lucide-react";
import { fetchClassifications } from "../api";
import { diffBadge, srcBadge } from "../data";
import { DIFFICULTY_LABELS } from "../utils/difficulty";

const ALL = "All";

export default function QuestionHistoryPage({ refreshKey = 0 }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [diff, setDiff]       = useState(ALL);
  const [src, setSrc]         = useState(ALL);
  const [error, setError]     = useState("");

  useEffect(() => {
    setLoading(true);
    fetchClassifications()
      .then(data => {
        setError("");
        setRows(data);
      })
      .catch(() => {
        setRows([]);
        setError("Couldn't load question history right now. Try refreshing in a moment.");
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const sources = [ALL, ...Array.from(new Set(rows.map(r => r.source)))];
  const diffs   = [ALL, ...DIFFICULTY_LABELS];

  const filtered = rows.filter(r => {
    const matchSearch = r.question.toLowerCase().includes(search.toLowerCase());
    const matchDiff   = diff === ALL || r.difficulty === diff;
    const matchSrc    = src  === ALL || r.source    === src;
    return matchSearch && matchDiff && matchSrc;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Question History</h2>
        <p className="text-sm text-gray-400 mt-1">All classified questions with search and filter.</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-300" />
          <select value={diff} onChange={e => setDiff(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
            {diffs.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <select value={src} onChange={e => setSrc(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          {sources.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-gray-400 self-center">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/70">
                {["#", "Question", "Source", "Difficulty", "Confidence", "Analyzed At"].map((h, i) => (
                  <th key={i} className={`text-left text-xs font-semibold text-gray-400 px-4 py-3 whitespace-nowrap ${i === 3 ? "min-w-[108px]" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : error && rows.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm font-medium text-red-600">
                        {error}
                      </td>
                    </tr>
                  )
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                        No questions match your filters.
                      </td>
                    </tr>
                  )
                  : filtered.map((row, i) => (
                    <tr key={row.id ?? i} className="border-t border-gray-50 hover:bg-purple-50/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                            <FileText className="w-3 h-3 text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-700 max-w-[280px] truncate" title={row.question}>{row.question}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${srcBadge[row.source] || "bg-gray-100 text-gray-600"}`}>{row.source}</span>
                      </td>
                      <td className="min-w-[108px] px-4 py-3">
                        <span className={`inline-flex min-h-6 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${diffBadge[row.difficulty] || "bg-gray-100 text-gray-600"}`}>{row.difficulty}</span>
                      </td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-purple-500" style={{ width: `${row.conf}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-8 text-right">{row.conf}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{row.date}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
