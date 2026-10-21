import { AlertCircle, BarChart3, BookOpenCheck, Flame, ListChecks, Route, Sparkles } from "lucide-react";
import Achievements from "../features/study-roadmap/components/Achievements.jsx";
import AIInsights from "../features/study-roadmap/components/AIInsights.jsx";
import AnalyticsSection from "../features/study-roadmap/components/AnalyticsSection.jsx";
import FloatingAssistant from "../features/study-roadmap/components/FloatingAssistant.jsx";
import ProgressCard from "../features/study-roadmap/components/ProgressCard.jsx";
import QuestionRecommendation from "../features/study-roadmap/components/QuestionRecommendation.jsx";
import RecentActivity from "../features/study-roadmap/components/RecentActivity.jsx";
import RecommendationPanel from "../features/study-roadmap/components/RecommendationPanel.jsx";
import RoadmapHero from "../features/study-roadmap/components/RoadmapHero.jsx";
import RoadmapSkeleton from "../features/study-roadmap/components/RoadmapSkeleton.jsx";
import RoadmapTimeline from "../features/study-roadmap/components/RoadmapTimeline.jsx";
import SkillRadar from "../features/study-roadmap/components/SkillRadar.jsx";
import TodaysGoal from "../features/study-roadmap/components/TodaysGoal.jsx";
import TopicCard from "../features/study-roadmap/components/TopicCard.jsx";
import WeeklyPlanner from "../features/study-roadmap/components/WeeklyPlanner.jsx";
import { useStudyRoadmap } from "../features/study-roadmap/hooks/useStudyRoadmap.js";

const STAT_ICONS = [Route, ListChecks, BarChart3, Flame];
const STAT_COLORS = [
  "bg-purple-100 text-purple-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-orange-100 text-orange-600",
];

function EmptyRoadmap({ onAnalyze, onRetry }) {
  return (
    <div className="flex min-h-[480px] flex-col items-center justify-center rounded-3xl border border-dashed border-purple-200 bg-gradient-to-b from-white to-purple-50 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-100 text-purple-600">
        <BookOpenCheck className="h-9 w-9" />
      </div>
      <h2 className="mt-5 text-xl font-extrabold text-gray-900">No roadmap available yet</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">Analyze your first question so QDCA can understand your current level and generate a personalized path.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onAnalyze} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-200 hover:bg-purple-700">Analyze Your First Question</button>
        <button type="button" onClick={onRetry} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">Try Again</button>
      </div>
    </div>
  );
}

export default function StudyRoadmapPage({ user, onNavigate }) {
  const { data, loading, error, regenerate } = useStudyRoadmap();

  function openPractice() {
    onNavigate?.("Classify Question");
  }

  if (loading && !data) return <RoadmapSkeleton />;

  if (!data) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <EmptyRoadmap onAnalyze={openPractice} onRetry={regenerate} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error} Showing your most recent roadmap.</span>
        </div>
      )}

      <RoadmapHero data={data} userName={user?.name} onRegenerate={regenerate} regenerating={loading} />
      <TodaysGoal goal={data.todayGoal} onContinue={openPractice} />

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h2 className="font-extrabold text-gray-900">Quick Statistics</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.statistics.map((stat, index) => (
            <ProgressCard key={stat.key} {...stat} icon={STAT_ICONS[index]} color={STAT_COLORS[index]} />
          ))}
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <RoadmapTimeline topics={data.topics} onContinue={openPractice} />
        <RecommendationPanel recommendations={data.recommendations} />
      </div>

      <section>
        <div className="mb-4">
          <h2 className="font-extrabold text-gray-900">Topic Progress</h2>
          <p className="mt-1 text-xs text-gray-400">Target weak concepts and continue from exactly where you stopped.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.topics.map(topic => <TopicCard key={topic.id} topic={topic} onContinue={openPractice} />)}
        </div>
      </section>

      <WeeklyPlanner days={data.weeklyPlan} />
      <AnalyticsSection charts={data.charts} />

      <div className="grid items-start gap-5 xl:grid-cols-3">
        <SkillRadar skills={data.charts.skills} />
        <AIInsights insights={data.insights} />
        <RecentActivity items={data.recentActivity} />
      </div>

      <QuestionRecommendation questions={data.recommendedQuestions} onSolve={openPractice} />
      <Achievements achievements={data.achievements} />
      <FloatingAssistant currentTopic={data.todayGoal.topic} />
    </div>
  );
}
