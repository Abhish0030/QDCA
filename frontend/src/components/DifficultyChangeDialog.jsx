import { Copy, Download, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { DIFFICULTY_LABELS, diffBadge } from "../utils/difficulty";

export default function DifficultyChangeDialog({
  open,
  onClose,
  currentDifficulty,
  targetDifficulty,
  onTargetDifficultyChange,
  data,
  error,
  loading,
  onGenerate,
  onCopy,
  onDownload,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
      <button type="button" aria-label="Close difficulty dialog" className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-difficulty-title"
        className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-purple-100/80 bg-gradient-to-br from-white via-[#fffdfd] to-[#fbf7ff] shadow-2xl shadow-slate-900/15"
      >
        <header className="flex items-center justify-between border-b border-purple-100/70 bg-gradient-to-r from-white via-purple-50/40 to-amber-50/30 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 text-amber-600 shadow-sm ring-1 ring-amber-100">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 id="change-difficulty-title" className="text-base font-extrabold tracking-tight text-slate-900">Change Difficulty</h2>
              <p className="text-xs font-medium text-slate-500">Regenerate the same concept at a different cognitive level.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/90 hover:shadow-sm">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-white/35 to-purple-50/20 px-4 py-4 sm:px-6 sm:py-5">
          <div className="rounded-2xl border border-purple-100/80 bg-gradient-to-r from-white via-purple-50/45 to-orange-50/30 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Difficulty Conversion</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${diffBadge[currentDifficulty]}`}>{currentDifficulty}</span>
                  <span className="text-sm font-bold text-slate-400">to</span>
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${diffBadge[targetDifficulty] || "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200"}`}>{targetDifficulty}</span>
                </div>
              </div>
              <div className="w-full sm:w-56">
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Target Difficulty</label>
                <select
                  value={targetDifficulty}
                  onChange={event => onTargetDifficultyChange(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-purple-100 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {DIFFICULTY_LABELS.filter(level => level !== currentDifficulty).map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onGenerate(false)}
              disabled={loading}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {data ? "Generate Again" : "Generate Converted Question"}
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {loading ? (
              <LoadingPanel />
            ) : error ? (
              <div className="rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
            ) : data ? (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  <QuestionPanel title="Original Question" question={data.originalQuestion} />
                  <QuestionPanel title="Converted Question" question={data.convertedQuestion} highlight />
                </div>

                <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-[#faf5ff] via-[#fffdfd] to-[#eef4ff] p-4 shadow-sm sm:p-5">
                  <h3 className="text-sm font-extrabold tracking-tight text-slate-900">What Changed</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{data.explanation}</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <MetaCard title="Subject / Domain" value={data.subject} />
                  <MetaCard title="Updated Bloom's Taxonomy" value={data.analysis?.bloomsLevel} />
                  <MetaCard title="Estimated Student Level" value={data.estimatedStudentLevel} />
                  <MetaCard title="Estimated Time" value={data.estimatedTime} />
                </div>

                {data.keyConcepts?.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
                    <h3 className="text-sm font-bold text-gray-900">Key Concepts Preserved</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.keyConcepts.map(concept => (
                        <span key={`${data.convertedQuestion}-${concept}`} className="rounded-full border border-purple-100 bg-gradient-to-r from-purple-50 to-fuchsia-50 px-3 py-1 text-xs font-bold text-purple-700 shadow-sm">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-purple-100 bg-gradient-to-br from-white to-purple-50/40 px-4 py-8 text-center text-sm font-medium text-slate-400">
                Pick a target difficulty and generate a new version of the question.
              </div>
            )}
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-purple-100/70 bg-gradient-to-r from-white via-white to-purple-50/30 px-4 py-3.5 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCopy}
            disabled={!data || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!data || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            type="button"
            onClick={() => onGenerate(true)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        </footer>
      </section>
    </div>
  );
}

function QuestionPanel({ title, question, highlight = false }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${highlight ? "border-purple-100 bg-gradient-to-br from-purple-50/70 via-white to-fuchsia-50/50" : "border-gray-100 bg-gradient-to-br from-white to-slate-50/60"}`}>
      <h3 className="text-sm font-extrabold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-8 text-slate-700">{question}</p>
    </div>
  );
}

function MetaCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-slate-50/70 p-4 shadow-sm">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm font-bold text-slate-800">{value || "Not available"}</p>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-fuchsia-50 px-4 py-3 text-sm font-medium text-purple-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        Regenerating the question at the new difficulty…
      </div>
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-slate-50/70 p-4">
        <div className="h-4 w-40 rounded bg-gray-200" />
        <div className="mt-4 space-y-2">
          <div className="h-3 rounded bg-gray-200" />
          <div className="h-3 rounded bg-gray-200" />
          <div className="h-3 w-4/5 rounded bg-gray-200" />
        </div>
      </div>
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-slate-50/70 p-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-4 space-y-2">
          <div className="h-3 rounded bg-gray-200" />
          <div className="h-3 rounded bg-gray-200" />
          <div className="h-3 w-5/6 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
