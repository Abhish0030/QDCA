import { useState } from "react";
import { Search, FileText, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { diffBadge } from "../data";
import { fetchSimilarQuestions } from "../api";

export default function SimilarQuestionsPage() {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [assistant, setAssistant] = useState(null);
  const [searched, setSearched] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

  async function runSearch(searchText) {
    if (!searchText.trim()) return;
	setLoading(true);
	setError("");
	try {
	  const data = await fetchSimilarQuestions(searchText.trim());
	  setResults(data.matches || []);
	  setAssistant(data.assistant || null);
	  setSearched(true);
	} catch (error) {
	  setResults([]);
	  setAssistant(null);
	  setSearched(true);
	  setError(
		error instanceof Error && error.message
		  ? error.message
		  : "Could not search the semantic question index. Check the backend and Ollama.",
	  );
	} finally {
	  setLoading(false);
	}
  }

  async function handleSearch(e) {
    e.preventDefault();
    await runSearch(query);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Similar Questions</h2>
        <p className="text-sm text-gray-400 mt-1">Find questions similar to yours from the question bank.</p>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col gap-3 min-[376px]:flex-row min-[376px]:items-start"
      >
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter a question to find similar ones…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <button
          type="submit"
		  disabled={!query.trim() || loading}
          className="w-full min-[376px]:w-auto min-[376px]:shrink-0 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-purple-200"
        >
		  {loading ? <><Loader2 className="inline w-4 h-4 mr-2 animate-spin" />Searching…</> : "Search"}
        </button>
      </form>

      {/* Results */}
	  {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

      {assistant && searched && !loading && (
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-fuchsia-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-200">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">AI search assistant</p>
                {assistant.detectedSubject && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-purple-700 ring-1 ring-purple-100">
                    {assistant.detectedSubject}
                  </span>
                )}
                {assistant.model && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-500 ring-1 ring-gray-100">
                    {assistant.model}
                  </span>
                )}
                {assistant.fallback && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
                    Fallback mode
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {assistant.summary || "The assistant analyzed your query and prepared refined search suggestions."}
              </p>
              {assistant.relatedTopics?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {assistant.relatedTopics.map(topic => (
                    <span key={topic} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-100">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
              {assistant.suggestedQueries?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-500">
                    <Sparkles className="h-3.5 w-3.5" />
                    Suggested searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assistant.suggestedQueries.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={async () => {
                          setQuery(item);
                          await runSearch(item);
                        }}
                        className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-50"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {searched && !loading && (
        results.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <p className="text-sm text-gray-400">No similar questions found yet. Try one of the AI suggestions above.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-700">{results.length} similar question{results.length !== 1 ? "s" : ""} found</p>
            </div>
            <div className="divide-y divide-gray-50">
              {results.map((row, i) => (
                <div
                  key={row.id ?? i}
                  className="flex flex-col gap-3 px-4 py-4 hover:bg-purple-50/30 transition-colors min-[376px]:flex-row min-[376px]:items-start min-[376px]:gap-4 sm:px-5"
                >
                  <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3 h-3 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 mb-2">{row.question}</p>
                    <div className="flex flex-wrap items-center gap-2">
					  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700">{row.source}</span>
					  {row.difficulty && <span className={`inline-flex min-h-6 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold leading-none ${diffBadge[row.difficulty] || "bg-gray-100 text-gray-600"}`}>{row.difficulty}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 min-[376px]:text-right">
                    <span className="text-xs font-bold text-purple-600">{Math.round(row.score * 100)}%</span>
                    <p className="text-[10px] text-gray-400">match</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {!searched && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">Enter a question above to find similar questions</p>
        </div>
      )}
    </div>
  );
}
