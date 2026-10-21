import { useMemo, useState } from "react";
import { recentAdminActions } from "../data/mockData.js";

const PAGE_SIZE = 6;

const MOCK_LOGS = recentAdminActions.map((item, index) => ({
  id: index + 1,
  admin: item.admin,
  action: item.action,
  target: item.target,
  category: index % 2 === 0 ? "Moderation" : "Reporting",
  time: item.time,
}));

export default function AdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return MOCK_LOGS.filter((entry) =>
      !query ||
      entry.admin.toLowerCase().includes(query) ||
      entry.action.toLowerCase().includes(query) ||
      entry.target.toLowerCase().includes(query),
    );
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Audit Logs</h2>
        <p className="mt-1 text-sm text-gray-400">Recent admin actions captured for moderation and reporting review.</p>
      </div>

      <input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        placeholder="Search audit actions..."
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
      />

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-gray-500">
                <th className="px-5 py-3.5 font-semibold">Admin</th>
                <th className="px-5 py-3.5 font-semibold">Action</th>
                <th className="px-5 py-3.5 font-semibold">Target</th>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-medium text-gray-800">{entry.admin}</td>
                  <td className="px-5 py-4 text-gray-600">{entry.action}</td>
                  <td className="px-5 py-4 text-gray-500">{entry.target}</td>
                  <td className="px-5 py-4 text-gray-500">{entry.category}</td>
                  <td className="px-5 py-4 text-gray-400">{entry.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5 text-sm">
          <span className="text-xs text-gray-400">Showing {filtered.length} audit entries</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
