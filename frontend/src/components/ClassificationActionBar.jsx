import { lazy, memo, Suspense, useState } from "react";
import { FileText, Loader2, Wand2 } from "lucide-react";
import useQuestionAiActions from "../hooks/useQuestionAiActions";
import { toast } from "../lib/toast";

const GeneratedAnswerDialog = lazy(() => import("./GeneratedAnswerDialog.jsx"));
const DifficultyChangeDialog = lazy(() => import("./DifficultyChangeDialog.jsx"));

function ClassificationActionBar({ question, difficulty, model = "auto" }) {
  const [answerOpen, setAnswerOpen] = useState(false);
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const {
    answerData,
    answerError,
    answerLoading,
    answerStreamText,
    answerStage,
    conversionData,
    conversionError,
    conversionLoading,
    targetDifficulty,
    setTargetDifficulty,
    loadAnswer,
    loadDifficultyChange,
    copyAnswer,
    copyConversion,
  } = useQuestionAiActions({ question, difficulty, model });

  async function handleOpenAnswer() {
    setAnswerOpen(true);
    try {
      await loadAnswer();
    } catch {
      toast.error("Could not generate the answer right now.");
    }
  }

  function handleOpenDifficulty() {
    setDifficultyOpen(true);
  }

  async function handleGenerateDifficulty(force = false) {
    try {
      await loadDifficultyChange(targetDifficulty, { force });
    } catch {
      toast.error("Could not regenerate the question at the new difficulty.");
    }
  }

  function handleDownload() {
    if (!conversionData) return;

    const blob = new Blob(
      [[
        `Original Difficulty: ${conversionData.originalDifficulty}`,
        `New Difficulty: ${conversionData.newDifficulty}`,
        "",
        "Original Question:",
        conversionData.originalQuestion,
        "",
        "Converted Question:",
        conversionData.convertedQuestion,
        "",
        "AI Explanation:",
        conversionData.explanation,
      ].join("\n")],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qdca-converted-question.txt";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Converted question downloaded.");
  }

  return (
    <>
      <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">AI Actions</p>
            <p className="mt-1 text-sm text-gray-600">Generate a worked answer or rewrite the same concept at a new difficulty.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={handleOpenAnswer}
              disabled={answerLoading || conversionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {answerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Generate Answer
            </button>
            <button
              type="button"
              onClick={handleOpenDifficulty}
              disabled={answerLoading || conversionLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {conversionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Change Difficulty
            </button>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <GeneratedAnswerDialog
          open={answerOpen}
          onClose={() => setAnswerOpen(false)}
          data={answerData}
          error={answerError}
          loading={answerLoading}
          streamText={answerStreamText}
          stage={answerStage}
          onCopy={copyAnswer}
          onRetry={() => loadAnswer({ force: true })}
        />
        <DifficultyChangeDialog
          open={difficultyOpen}
          onClose={() => setDifficultyOpen(false)}
          currentDifficulty={difficulty}
          targetDifficulty={targetDifficulty}
          onTargetDifficultyChange={setTargetDifficulty}
          data={conversionData?.newDifficulty === targetDifficulty ? conversionData : null}
          error={conversionError}
          loading={conversionLoading}
          onGenerate={handleGenerateDifficulty}
          onCopy={copyConversion}
          onDownload={handleDownload}
        />
      </Suspense>
    </>
  );
}

export default memo(ClassificationActionBar);
