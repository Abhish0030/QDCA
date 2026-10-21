import { useState } from "react";
import { X, Brain, Loader2 } from "lucide-react";
import { classifyQuestion } from "../api";
import ConfidenceGauge from "./ConfidenceGauge";
import ModelSelector from "./ModelSelector";
import DifficultyScale from "./DifficultyScale";
import { getDifficulty } from "../utils/difficulty";
import ClassificationReason from "./ClassificationReason";
import RagStatus from "./RagStatus";
import ClassificationActionBar from "./ClassificationActionBar";

export default function ClassifyModal({ open, onClose, onSuccess }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");
  const [model, setModel]       = useState("auto");

  if (!open) return null;

  function reset() {
    setQuestion("");
    setLoading(false);
    setResult(null);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await classifyQuestion(question.trim(), "Manual", model);
      setResult(data.result);
      onSuccess?.();
    } catch (classificationError) {
      setError(classificationError instanceof Error ? classificationError.message : "Classification failed.");
    } finally {
      setLoading(false);
    }
  }

  const difficulty = result ? getDifficulty(result.difficulty) : null;
  const colors = difficulty?.panel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close classification dialog"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="classify-modal-title"
        className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-slate-50 shadow-2xl animate-fade-in sm:max-h-[calc(100dvh-2rem)]"
      >
        {/* Modal header */}
        <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-slate-200/70 bg-white px-4 py-3.5 shadow-[0_8px_24px_-24px_rgba(15,23,42,0.7)] sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-600" />
            </div>
            <h2 id="classify-modal-title" className="font-bold text-gray-900">Analyze New Question</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close classification dialog"
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="modal-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_48%,#faf7ff_100%)] px-4 py-4 sm:px-6 sm:py-5">
          {/* Form — shown before result */}
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Question Text
                </label>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Paste or type the question here…"
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                  autoFocus
                />
              </div>

              <ModelSelector value={model} onChange={setModel} disabled={loading} />

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-purple-200"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Classifying…</>
                  : "Classify Question"
                }
              </button>
            </form>
          ) : (
            /* Result panel */
            <div className="space-y-3 sm:space-y-4">
              <DifficultyScale activeDifficulty={result.difficulty} />
              {/* Question preview */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600 italic leading-relaxed">
                "{result.question}"
              </div>

              {/* Difficulty + Confidence */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`flex min-h-[132px] flex-col justify-center rounded-xl border px-5 py-4 ${colors.bg} ${colors.border}`}>
                  <p className="text-xs font-semibold text-gray-400 mb-1">Difficulty</p>
                  <p className={`text-2xl font-extrabold ${colors.text}`}>{difficulty.label}</p>
                </div>
                <ConfidenceGauge value={result.conf} />
              </div>

              <RagStatus rag={result.rag} />
              <ClassificationReason result={result} />
              <ClassificationActionBar
                question={result.question}
                difficulty={difficulty.label}
                model={result.model}
              />

            </div>
          )}
        </div>

        {result && (
          <div className="relative z-10 flex shrink-0 gap-3 border-t border-slate-200/70 bg-white px-4 py-3 shadow-[0_-10px_28px_-25px_rgba(76,29,149,0.55)] sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-xl border border-purple-200 py-2.5 text-sm font-semibold text-purple-600 transition-colors hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              Classify Another
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
