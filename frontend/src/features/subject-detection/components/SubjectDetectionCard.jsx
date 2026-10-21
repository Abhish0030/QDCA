import { useState } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, Pencil, X, RotateCcw } from "lucide-react";
import SubjectChip     from "./SubjectChip";
import TopicChip       from "./TopicChip";
import ConfidenceBadge from "./ConfidenceBadge";
import DetectionSkeleton from "./DetectionSkeleton";

/**
 * SubjectDetectionCard
 *
 * Props:
 *   detecting  — boolean: show skeleton
 *   detection  — { primarySubject, relatedSubjects, topics, subtopics, confidence } | null
 *   error      — string | null
 *   onRetry    — fn: retry detection
 *   onChange   — fn(detection): called when user edits detection
 */
export default function SubjectDetectionCard({ detecting, detection, error, onRetry, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(null);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (detecting) return <DetectionSkeleton />;

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-600">Unable to detect subject automatically.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRetry}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-md shadow-purple-200">
            <RotateCcw className="w-3.5 h-3.5" /> Retry Detection
          </button>
        </div>
      </div>
    );
  }

  // ── No detection yet ─────────────────────────────────────────────────────
  if (!detection) return null;

  // ── Edit mode ────────────────────────────────────────────────────────────
  if (editing) {
    const d = draft ?? detection;

    function saveDraft() {
      onChange?.(draft ?? detection);
      setEditing(false);
      setDraft(null);
    }

    function cancelDraft() {
      setEditing(false);
      setDraft(null);
    }

    function updateDraft(key, value) {
      setDraft(prev => ({ ...(prev ?? detection), [key]: value }));
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-gray-800">Edit Detection</span>
          </div>
          <button onClick={cancelDraft} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Primary Subject */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Primary Domain</label>
          <input
            value={d.primarySubject}
            onChange={e => updateDraft("primarySubject", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="Data Structures, Finance, Biology, Legal Reasoning..."
          />
        </div>

        {/* Related Subjects */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Related Domains</label>
          <input
            value={d.relatedSubjects.join(", ")}
            onChange={e => updateDraft("relatedSubjects", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="Algorithms, Java, Complexity Analysis"
          />
        </div>

        {/* Topics */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Topics (comma-separated)</label>
          <input
            value={d.topics.join(", ")}
            onChange={e => updateDraft("topics", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            placeholder="Newton's Laws, Motion…"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={saveDraft}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors shadow-md shadow-purple-200">
            Save
          </button>
          <button onClick={cancelDraft}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Result view ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="text-sm font-semibold text-gray-800">AI Subject Detection</span>
        </div>
        <ConfidenceBadge value={detection.confidence} />
      </div>

      {/* Primary Subject */}
      <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-400 w-28 shrink-0">Primary Domain</span>
        <SubjectChip label={detection.primarySubject} variant="primary" />
      </div>

      {/* Related Subjects */}
      {detection.relatedSubjects.length > 0 && (
        <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-400 w-28 shrink-0 pt-0.5">Related</span>
          <div className="flex flex-wrap gap-1.5">
            {detection.relatedSubjects.map(s => <SubjectChip key={s} label={s} />)}
          </div>
        </div>
      )}

      {/* Topics */}
      {detection.topics.length > 0 && (
        <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-400 w-28 shrink-0 pt-0.5">Topics</span>
          <div className="flex flex-wrap gap-1.5">
            {detection.topics.map(t => <TopicChip key={t} label={t} />)}
          </div>
        </div>
      )}

      {/* Subtopics */}
      {detection.subtopics?.length > 0 && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 w-28 shrink-0 pt-0.5">📄 Subtopics</span>
          <div className="flex flex-wrap gap-1.5">
            {detection.subtopics.map(t => <TopicChip key={t} label={t} />)}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-gray-400">AI detected the question context</span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
        >
          <Pencil className="w-3 h-3" /> Edit Detection
        </button>
      </div>
    </div>
  );
}
