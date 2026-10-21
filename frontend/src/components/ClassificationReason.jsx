import { BrainCircuit, Clock3, GraduationCap, Lightbulb } from "lucide-react";

function EvidenceChip({ label, value }) {
  if (!value || value === "Not specified") return null;

  return (
    <div className="rounded-xl border border-purple-100 bg-white px-3 py-2 shadow-sm">
      <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-gray-700">{value}</p>
    </div>
  );
}

export default function ClassificationReason({ result }) {
  const reason = result?.reason || result?.explanation;
  const analysis = result?.analysis;

  if (!reason) return null;

  return (
    <section className="classification-reason overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/60">
      <div className="flex items-start gap-3 border-b border-purple-100/80 px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-200">
          <Lightbulb className="h-4.5 w-4.5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">Why {result.difficulty}?</h4>
          <p className="mt-1 text-xs leading-5 text-gray-600">{reason}</p>
        </div>
      </div>

      {analysis && (
        <div className="classification-evidence-grid grid grid-cols-2 gap-2 p-3">
          <EvidenceChip label="Bloom's level" value={analysis.bloomsLevel} />
          <EvidenceChip label="Concept depth" value={analysis.conceptComplexity} />
          <EvidenceChip label="Reasoning" value={analysis.reasoningDepth} />
          <EvidenceChip label="Cognitive load" value={analysis.cognitiveLoad} />
        </div>
      )}

      {(result.estimatedStudentLevel || result.estimatedTime) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-purple-100/80 px-4 py-3 text-[11px] font-semibold text-gray-500">
          {result.estimatedStudentLevel && result.estimatedStudentLevel !== "Not specified" && (
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-purple-500" />
              {result.estimatedStudentLevel}
            </span>
          )}
          {result.estimatedTime && result.estimatedTime !== "Not specified" && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-purple-500" />
              {result.estimatedTime}
            </span>
          )}
          {result.keyConcepts?.length > 0 && (
            <span className="flex items-center gap-1.5">
              <BrainCircuit className="h-3.5 w-3.5 text-purple-500" />
              {result.keyConcepts.slice(0, 3).join(" · ")}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
