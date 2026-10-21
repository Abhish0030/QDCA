import { AlertTriangle, BookOpenCheck, Sparkles } from "lucide-react";

export default function RagStatus({ rag }) {
  const status = rag?.status || (rag?.grounded ? "grounded" : "unavailable");

  if (status === "grounded") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
        <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="text-xs leading-5">
          <p className="font-bold">RAG grounded</p>
          <p className="text-emerald-700">
            {rag.chunkCount} relevant source chunk{rag.chunkCount !== 1 ? "s" : ""} retrieved
            {rag.sources?.length ? ` from ${rag.sources.join(", ")}` : ""}.
          </p>
        </div>
      </div>
    );
  }

  if (status === "no_match") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-violet-800">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="text-xs leading-5">
          <p className="font-bold">General knowledge mode</p>
          <p className="text-violet-700">No relevant indexed source matched this question, so the model classified it using its trained knowledge.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="text-xs leading-5">
        <p className="font-bold">RAG temporarily unavailable</p>
        <p className="text-amber-700">Classification completed with model knowledge; indexed sources could not be checked.</p>
      </div>
    </div>
  );
}
