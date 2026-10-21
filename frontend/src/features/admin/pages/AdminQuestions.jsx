import { useCallback, useEffect, useState } from "react";
import { Eye, FileQuestion } from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import AdminAlert from "../components/AdminAlert.jsx";
import AdminEmptyState from "../components/AdminEmptyState.jsx";
import AdminTableSkeleton from "../components/AdminTableSkeleton.jsx";
import { fetchAdminQuestions, overrideQuestionDifficulty } from "../../../api/adminApi.js";
import { toast } from "../../../lib/toast.js";

const PAGE_SIZE = 10;
const FILTERS = ["All", "Easy", "Medium", "Hard", "Flagged"];
const DIFFICULTY_OPTIONS = ["Very Easy", "Easy", "Medium", "Hard", "Expert"];

function QuestionModal({ question, onClose, onOverride, saving }) {
  const [difficulty, setDifficulty] = useState(question?.difficulty ?? "Medium");

  useEffect(() => {
    setDifficulty(question?.difficulty ?? "Medium");
  }, [question]);

  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="font-bold text-gray-900">Question Details</h3>
          <p className="mt-1 text-sm text-gray-400">Review the question and apply a real difficulty override if needed.</p>
        </div>
        <div className="space-y-5 px-6 py-5">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-sm leading-7 text-gray-700">
            {question.text}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Submitted By" value={question.submittedBy} />
            <InfoRow label="Date" value={question.date} />
            <InfoRow label="Confidence" value={`${question.confidence}%`} />
            <InfoRow label="Current Difficulty" value={question.difficulty} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Override Difficulty</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDifficulty(option)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                    difficulty === option
                      ? "border-[#FFC3CF] bg-[#FFF1F4] text-[#FF385C]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onOverride(question.id, difficulty)}
              className="flex-1 rounded-xl bg-[#FF385C] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FFB9C7] hover:bg-[#E63152] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Override
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setFetchError("");

    try {
      const response = await fetchAdminQuestions({
        filter: filter.toLowerCase(),
        page,
        limit: PAGE_SIZE,
      });

      const query = search.trim().toLowerCase();
      const fetchedQuestions = Array.isArray(response.questions) ? response.questions : [];
      const filteredQuestions = query
        ? fetchedQuestions.filter((question) =>
            String(question.text || "").toLowerCase().includes(query) ||
            String(question.submittedBy || "").toLowerCase().includes(query),
          )
        : fetchedQuestions;

      setQuestions(filteredQuestions);
      setTotal(query ? filteredQuestions.length : Number(response.total || 0));
    } catch (error) {
      setFetchError(error.message || "Could not load moderated questions.");
    } finally {
      setLoading(false);
    }
  }, [filter, page, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadQuestions();
    }, search ? 250 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadQuestions, search]);

  async function handleOverride(id, difficulty) {
    setSaving(true);
    setMutationError("");

    try {
      await overrideQuestionDifficulty(id, difficulty);
      toast.success("Question difficulty updated.");
      setActiveQuestion(null);
      await loadQuestions();
    } catch (error) {
      setMutationError(error.message || "The difficulty override failed.");
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Question Moderation</h2>
        <p className="mt-1 text-sm text-gray-400">Review classified questions and apply real admin overrides where needed.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search questions or submitter..."
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C3]"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setFilter(item);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                filter === item ? "bg-[#FF385C] text-white" : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {fetchError ? <AdminAlert title="We could not load admin questions." message={fetchError} onRetry={loadQuestions} /> : null}
      {mutationError ? <AdminAlert title="The last question update failed." message={mutationError} /> : null}

      {loading ? (
        <AdminTableSkeleton rows={6} columns={6} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-gray-500">
                  <th className="px-5 py-3.5 font-semibold">Question</th>
                  <th className="px-5 py-3.5 font-semibold">Difficulty</th>
                  <th className="px-5 py-3.5 font-semibold">Confidence</th>
                  <th className="px-5 py-3.5 font-semibold">Submitted By</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10">
                      <AdminEmptyState
                        icon={FileQuestion}
                        title="No questions matched this view"
                        description="Try a different filter or search term."
                      />
                    </td>
                  </tr>
                ) : (
                  questions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4">
                        <p className="max-w-xl font-medium text-gray-800">{question.text}</p>
                        {question.flagged ? (
                          <div className="mt-2">
                            <StatusBadge value="flagged" />
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4"><StatusBadge value={question.difficulty} /></td>
                      <td className="px-5 py-4 text-gray-500">{question.confidence}%</td>
                      <td className="px-5 py-4 text-gray-500">{question.submittedBy}</td>
                      <td className="px-5 py-4 text-gray-400">{question.date}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveQuestion(question)}
                            className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
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

      <QuestionModal
        question={activeQuestion}
        onClose={() => setActiveQuestion(null)}
        onOverride={handleOverride}
        saving={saving}
      />
    </div>
  );
}
