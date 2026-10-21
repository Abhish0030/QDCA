import { useEffect, useState } from "react";
import { FileBarChart, Download, Calendar, RefreshCw, Loader2 } from "lucide-react";
import { apiBaseUrl } from "../lib/env.js";
import { requestJson } from "../lib/http.js";

const typeBadge = {
  Daily:   "bg-green-100 text-green-700",
  Weekly:  "bg-blue-100 text-blue-700",
  Monthly: "bg-purple-100 text-purple-700",
  Custom:  "bg-orange-100 text-orange-700",
};

function downloadJSON(data, filename) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");
    requestJson(`${apiBaseUrl}/reports`, { credentials: "include" })
      .then(setReports)
      .catch((loadError) => setError(loadError.message || "Could not load reports — make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-400 mt-1">
          Reports are generated automatically from your uploads and classifications.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-800 text-sm">
            Generated Reports
            {!loading && reports.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">({reports.length} report{reports.length !== 1 ? "s" : ""})</span>
            )}
          </h3>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading reports…
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="px-5 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileBarChart className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No reports yet</p>
            <p className="text-xs text-gray-300 mt-1">Upload a PDF or classify a question to generate your first report</p>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="divide-y divide-gray-50">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-purple-50/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <FileBarChart className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{r.desc}</p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadge[r.type] || "bg-gray-100 text-gray-600"}`}>
                    {r.type}
                  </span>
                  <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {r.date}
                  </div>
                  <button
                    onClick={() => downloadJSON(r.data, `${r.title.replace(/[^a-z0-9]/gi, "_")}.json`)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 text-sm text-purple-700">
        <p className="font-semibold mb-1">How reports are generated</p>
        <ul className="space-y-1 text-purple-600 text-xs">
          <li>• <strong>Daily</strong> — created when you classify questions today</li>
          <li>• <strong>Custom</strong> — created automatically after every PDF upload</li>
          <li>• <strong>Monthly</strong> — overall all-time summary always available</li>
          <li>• Click <strong>Download</strong> to save the report data as a JSON file</li>
          <li>• Click <strong>Refresh</strong> after new uploads or classifications to see updated reports</li>
        </ul>
      </div>
    </div>
  );
}

