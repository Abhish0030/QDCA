import { useCallback, useEffect, useState } from "react";
import { RefreshCcw, Search, Upload } from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import AdminAlert from "../components/AdminAlert.jsx";
import AdminEmptyState from "../components/AdminEmptyState.jsx";
import AdminTableSkeleton from "../components/AdminTableSkeleton.jsx";
import { fetchAdminUploads, retryUpload } from "../../../api/adminApi.js";
import { toast } from "../../../lib/toast.js";

const PAGE_SIZE = 10;

export default function AdminUploads() {
  const [uploads, setUploads] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [total, setTotal] = useState(0);
  const [retryingUploadId, setRetryingUploadId] = useState("");

  const loadUploads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchAdminUploads({ page, limit: PAGE_SIZE });
      const query = search.trim().toLowerCase();
      const fetchedUploads = Array.isArray(response.uploads) ? response.uploads : [];
      const filteredUploads = fetchedUploads.filter((upload) => {
        const matchesQuery =
          !query ||
          String(upload.filename || "").toLowerCase().includes(query) ||
          String(upload.uploadedBy || "").toLowerCase().includes(query);
        const matchesStatus = status === "all" || upload.status === status;
        return matchesQuery && matchesStatus;
      });

      setUploads(filteredUploads);
      setTotal(query || status !== "all" ? filteredUploads.length : Number(response.total || 0));
    } catch (nextError) {
      setError(nextError.message || "Could not load indexed uploads.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadUploads();
    }, search ? 250 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadUploads, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleRetry(upload) {
    if (!upload?.id) return;

    setMutationError("");
    setRetryingUploadId(upload.id);

    try {
      await retryUpload(upload.id);
      toast.success(`Retry started for ${upload.filename}.`);
      await loadUploads();
    } catch (nextError) {
      setMutationError(nextError.message || "The upload retry failed.");
    } finally {
      setRetryingUploadId("");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Upload Management</h2>
        <p className="mt-1 text-sm text-gray-400">Track real upload jobs, indexing failures, and retryable RAG processing from uploaded documents.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by filename or uploader..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C3]"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C3]"
        >
          <option value="all">All Status</option>
          <option value="done">Done</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error ? <AdminAlert title="We could not load indexed uploads." message={error} onRetry={loadUploads} /> : null}
      {mutationError ? <AdminAlert title="The last upload action failed." message={mutationError} /> : null}

      {loading ? (
        <AdminTableSkeleton rows={6} columns={6} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-gray-500">
                  <th className="px-5 py-3.5 font-semibold">Filename</th>
                  <th className="px-5 py-3.5 font-semibold">Uploaded By</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Questions Extracted</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {uploads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10">
                      <AdminEmptyState
                        icon={Upload}
                        title="No upload jobs matched"
                        description="Try a different filename, uploader, or status filter to find real upload records."
                      />
                    </td>
                  </tr>
                ) : (
                  uploads.map((upload) => (
                    <tr key={upload.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-800">{upload.filename}</p>
                          {upload.errorMessage ? (
                            <p className="max-w-xs text-xs leading-5 text-red-500">
                              {upload.errorMessage}
                            </p>
                          ) : upload.warningMessage ? (
                            <p className="max-w-xs text-xs leading-5 text-amber-600">
                              {upload.warningMessage}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{upload.uploadedBy}</td>
                      <td className="px-5 py-4 text-gray-400">{upload.date}</td>
                      <td className="px-5 py-4 text-gray-500">
                        <div className="space-y-1">
                          <p>{upload.questionsExtracted} extracted</p>
                          <p className="text-xs text-gray-400">
                            {upload.questionsClassified} classified · {upload.indexedChunks} indexed
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <StatusBadge value={upload.status} />
                          <p className="text-xs text-gray-400">
                            Attempt {Math.max(1, Number(upload.attemptCount || 1))}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {upload.status === "failed" ? (
                          <button
                            type="button"
                            onClick={() => handleRetry(upload)}
                            disabled={!upload.retryAvailable || retryingUploadId === upload.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#FFD7DE] bg-[#FFF4F6] px-3 py-2 text-xs font-semibold text-[#FF385C] transition-colors hover:bg-[#FFECEF] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RefreshCcw className={`h-3.5 w-3.5 ${retryingUploadId === upload.id ? "animate-spin" : ""}`} />
                            {upload.retryAvailable ? "Retry indexing" : "Retry unavailable"}
                          </button>
                        ) : (
                          <span className="inline-flex rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500">
                            {upload.status === "processing" ? "In progress" : "Indexed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5 text-sm">
            <span className="text-xs text-gray-400">
              Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
