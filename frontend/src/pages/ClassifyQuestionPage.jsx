import { useState, useEffect, useRef } from "react";
import { Brain, Loader2, RotateCcw } from "lucide-react";
import { classifyQuestion } from "../api";
import { detectSubject } from "../features/subject-detection/services/subjectDetectionService.js";
import SubjectDetectionCard from "../features/subject-detection/components/SubjectDetectionCard.jsx";
import SubjectChip  from "../features/subject-detection/components/SubjectChip.jsx";
import TopicChip    from "../features/subject-detection/components/TopicChip.jsx";
import ConfidenceGauge from "../components/ConfidenceGauge";
import ModelSelector from "../components/ModelSelector";
import DifficultyScale from "../components/DifficultyScale";
import ClassificationReason from "../components/ClassificationReason";
import RagStatus from "../components/RagStatus";
import ClassificationActionBar from "../components/ClassificationActionBar";
import { getDifficulty } from "../utils/difficulty";

export default function ClassifyQuestionPage({ onSuccess }) {
  const [question,    setQuestion]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState("");
  const [history,     setHistory]     = useState([]);
  const [model,       setModel]       = useState("auto");

  // Detection state
  const [detecting,   setDetecting]   = useState(false);
  const [detection,   setDetection]   = useState(null);
  const [detectError, setDetectError] = useState(null);

  // Debounce detection trigger
  const debounceRef = useRef(null);

  // Auto-detect when question changes (debounced 800ms after typing stops)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!question.trim() || question.trim().length < 10) {
      setDetection(null);
      setDetectError(null);
      setDetecting(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      runDetection(question.trim());
    }, 800);

    return () => clearTimeout(debounceRef.current);
  }, [question]);

  async function runDetection(q) {
    setDetecting(true);
    setDetectError(null);
    try {
      const result = await detectSubject(q);
      setDetection(result);
    } catch {
      setDetectError("Detection failed");
    } finally {
      setDetecting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");

    try {
      const data = await classifyQuestion(question.trim(), "Manual", model);
      // Enrich result with detection metadata
      const enriched = {
        ...data.result,
        primarySubject:  detection?.primarySubject,
        relatedSubjects: detection?.relatedSubjects ?? [],
        topics:          detection?.topics ?? [],
        subtopics:       detection?.subtopics ?? [],
        detectionConf:   detection?.confidence,
      };
      setResult(enriched);
      setHistory(h => [enriched, ...h].slice(0, 10));
      onSuccess?.();
    } catch (classificationError) {
      setError(classificationError instanceof Error ? classificationError.message : "Classification failed.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQuestion("");
    setResult(null);
    setError("");
    setDetection(null);
    setDetectError(null);
    setDetecting(false);
  }

  const difficulty = result ? getDifficulty(result.difficulty) : null;
  const colors = difficulty?.panel;

  const canClassify = !loading && question.trim().length >= 5;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Classify Question</h2>
        <p className="text-sm text-gray-400 mt-1">Analyze any question using a consistent five-level cognitive difficulty scale.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <DifficultyScale activeDifficulty={result?.difficulty} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Input + Detection ─────────────────────── */}
        <div className="space-y-4">
          {/* Question Input */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <Brain className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Question Input</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question Text</label>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Paste or type your question here — AI will detect the subject automatically…"
                  rows={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                />
                {question.trim().length > 0 && question.trim().length < 10 && (
                  <p className="text-xs text-gray-400 mt-1">Type at least 10 characters to trigger detection…</p>
                )}
              </div>

              <ModelSelector value={model} onChange={setModel} disabled={loading} />

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!canClassify}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-purple-200"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Classifying…</>
                    : "Classify Question"}
                </button>
                {result && (
                  <button type="button" onClick={reset}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <RotateCcw className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Subject Detection Card */}
          <SubjectDetectionCard
            detecting={detecting}
            detection={detection}
            error={detectError}
            onRetry={() => question.trim() && runDetection(question.trim())}
            onChange={updated => setDetection(updated)}
          />
        </div>

        {/* ── Right: Result ───────────────────────────────── */}
        <div className="space-y-4">
          {result ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Classification Result</h3>

              <p className="text-xs text-gray-400">
                {result.actualModel ? `AI Model: ${result.actualModel}` : `AI Model: ${result.model}`}
                {result.provider ? ` via ${result.provider}` : ""}
                {result.fallback ? " (fallback)" : ""}
              </p>

              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600 italic leading-relaxed">
                "{result.question}"
              </div>

              <RagStatus rag={result.rag} />

              {/* Difficulty + Confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`flex min-h-[132px] flex-col justify-center rounded-xl border px-5 py-4 ${colors.bg} ${colors.border}`}>
                  <p className="text-xs font-semibold text-gray-400 mb-1">Difficulty</p>
                  <p className={`text-2xl font-extrabold ${colors.text}`}>{difficulty.label}</p>
                </div>
                <ConfidenceGauge value={result.conf} />
              </div>

              <ClassificationReason result={result} />

              <ClassificationActionBar
                question={result.question}
                difficulty={difficulty.label}
                model={result.model}
              />

              {/* Subject metadata from detection */}
              {result.primarySubject && (
                <div className="space-y-2.5 pt-1 border-t border-gray-50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-400 w-28 shrink-0">Primary Domain</span>
                    <SubjectChip label={result.primarySubject} variant="primary" />
                  </div>
                  {result.relatedSubjects?.length > 0 && (
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-400 w-28 shrink-0 pt-0.5">Related</span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.relatedSubjects.map(s => <SubjectChip key={s} label={s} />)}
                      </div>
                    </div>
                  )}
                  {result.topics?.length > 0 && (
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-400 w-28 shrink-0 pt-0.5">Topics</span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.topics.map(t => <TopicChip key={t} label={t} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center h-48">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Brain className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-400">Result will appear here</p>
              <p className="text-xs text-gray-300 mt-1">Enter a question and click Classify</p>
            </div>
          )}

          {/* Session history */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Session History</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className={`inline-flex min-h-6 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold leading-none ${getDifficulty(h.difficulty).badge} ring-1 ring-inset`}>
                      {h.difficulty}
                    </span>
                    <span className="text-xs text-gray-600 truncate flex-1">{h.question}</span>
                    <span className="text-xs text-gray-400 shrink-0">{h.conf}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
