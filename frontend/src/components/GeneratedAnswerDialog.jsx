import { Copy, Loader2, Sparkles, X } from "lucide-react";

export default function GeneratedAnswerDialog({
  open,
  onClose,
  data,
  error,
  loading,
  streamText,
  stage,
  onCopy,
  onRetry,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
      <button type="button" aria-label="Close answer dialog" className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="generated-answer-title"
        className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-900/15"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 id="generated-answer-title" className="text-base font-bold text-gray-900">Generated Answer</h2>
              <p className="text-xs text-gray-500">AI-generated explanation for this classified question.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "#ffd2db", backgroundColor: "#fff3f5", color: "#b4233c" }}>
                <Loader2 className="h-4 w-4 animate-spin" />
                {getStageLabel(stage)}
              </div>
              <StreamingStatusCard streamText={streamText} />
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
              <button type="button" onClick={onRetry} className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700">
                Try Again
              </button>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <QuestionCard question={data.question} />
              <SectionCard title="Correct Answer">
                <p className="text-sm leading-7 text-gray-700">{data.correctAnswer}</p>
              </SectionCard>
              <SectionCard title="Step-by-step Explanation">
                <ol className="space-y-2 text-sm leading-7 text-gray-700">
                  {data.stepByStepExplanation.map((step, index) => (
                    <li key={`${data.question}-step-${index}`} className="flex gap-3">
                      <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </SectionCard>
              <SectionCard title="Key Concepts">
                <div className="flex flex-wrap gap-2">
                  {data.keyConcepts.map(concept => (
                    <span key={`${data.question}-${concept}`} className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                      {concept}
                    </span>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Final Summary">
                <p className="text-sm leading-7 text-gray-700">{data.finalSummary}</p>
              </SectionCard>
            </div>
          ) : null}
        </div>

        <footer className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3.5 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCopy}
            disabled={!data || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            Copy Answer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
          >
            Done
          </button>
        </footer>
      </section>
    </div>
  );
}

function StreamingStatusCard({ streamText = "" }) {
  const charCount = streamText.length;
  const progress = Math.min(92, Math.max(12, Math.round(Math.log10(charCount + 10) * 28)));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Streaming model output</p>
          <p className="mt-1 text-xs text-gray-500">
            {charCount > 0
              ? `${charCount.toLocaleString()} characters received live from the model.`
              : "Waiting for the first streamed tokens..."}
          </p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: "#fff3f5", color: "#FF385C" }}>
          Live
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-[width] duration-200"
          style={{ width: `${progress}%`, backgroundColor: "#FF385C" }}
        />
      </div>
    </div>
  );
}

function getStageLabel(stage) {
  switch (stage) {
    case "grounding":
      return "Grounding the answer with retrieved context...";
    case "drafting":
      return "Streaming the answer from the model...";
    case "reviewing":
      return "Reviewing the streamed answer for clarity...";
    case "fallback":
      return "Retrying with the non-stream path...";
    default:
      return "Generating a detailed answer...";
  }
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function QuestionCard({ question }) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-indigo-50 px-4 py-3.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-purple-500">Question</p>
      <p className="mt-2 text-sm leading-7 text-gray-700">{question}</p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="mt-4 space-y-2">
        <div className="h-3 rounded bg-gray-200" />
        <div className="h-3 rounded bg-gray-200" />
        <div className="h-3 w-5/6 rounded bg-gray-200" />
      </div>
    </div>
  );
}
