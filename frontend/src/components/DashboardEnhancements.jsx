import { memo, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Pencil,
  Check,
  X,
  Flame,
  Gauge,
  Goal,
  Lightbulb,
  Loader2,
  Target,
  Trophy,
  TriangleAlert,
} from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";
import { updateDashboardModelStatus } from "../api";

const CARD_MOTION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: "easeOut" },
};

function DashboardEnhancements({
  overview,
  loading = false,
  error = "",
}) {
  const shouldReduceMotion = useReducedMotion();
  const safeOverview = useMemo(() => normalizeOverview(overview), [overview]);
  const [modelStatus, setModelStatus] = useState(safeOverview.modelStatus ?? null);
  const [modelActionError, setModelActionError] = useState("");
  const [switchingModel, setSwitchingModel] = useState("");
  const [weeklyGoalTarget, setWeeklyGoalTarget] = useState(safeOverview.weeklyGoal.target);
  const [goalDraft, setGoalDraft] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const weeklyGoalStorageKey = useMemo(
    () => buildWeeklyGoalStorageKey(safeOverview.welcome.userName),
    [safeOverview.welcome.userName],
  );

  useEffect(() => {
    setModelStatus(safeOverview.modelStatus ?? null);
  }, [safeOverview]);

  useEffect(() => {
    if (!safeOverview.weeklyGoal.target) return;
    if (editingGoal) return;
    const saved = readSavedWeeklyGoal(weeklyGoalStorageKey);
    const nextTarget = saved ?? safeOverview.weeklyGoal.target;
    setWeeklyGoalTarget(nextTarget);
    setGoalDraft(String(nextTarget));
  }, [editingGoal, safeOverview.weeklyGoal.target, weeklyGoalStorageKey]);

  function handleSaveWeeklyGoal() {
    const nextGoal = sanitizeWeeklyGoal(goalDraft, weeklyGoalTarget);

    try {
      window.localStorage.setItem(weeklyGoalStorageKey, String(nextGoal));
    } catch {
      // localStorage may be unavailable in restricted browser contexts.
    }

    setWeeklyGoalTarget(nextGoal);
    setGoalDraft(String(nextGoal));
    setEditingGoal(false);
  }

  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 xl:col-span-8">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-10 w-72 max-w-full animate-pulse rounded bg-gray-100" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-gray-50" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 xl:col-span-4">
          <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
          <div className="mt-4 grid grid-cols-1 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-2xl bg-gray-50" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!overview) {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Dashboard overview unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          {error || "We could not load your overview data right now. Please retry after the backend is reachable."}
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <motion.div
          {...(shouldReduceMotion ? {} : CARD_MOTION)}
          className="h-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:p-6 xl:col-span-8"
        >
          <div className="flex flex-col gap-4 lg:gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-500">
                {safeOverview.welcome.greeting}
              </p>
              <h2 className="mt-2 text-[1.9rem] font-bold leading-tight tracking-tight text-gray-900 sm:text-[2.2rem] lg:text-[2.5rem]">
                You&apos;ve classified <AnimatedNumber value={safeOverview.welcome.questionsToday} /> questions today.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400 sm:text-[15px]">
                Keep the momentum going with your current streak, live goal progress, and recent activity.
              </p>
            </div>
            <div className="w-full rounded-[28px] border border-purple-100 bg-gradient-to-br from-purple-50 to-fuchsia-50 px-5 py-4 text-left shadow-sm shadow-purple-100/60 sm:max-w-[220px] sm:self-start sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-purple-400">Goal</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-purple-600 sm:text-4xl">
                <AnimatedNumber value={safeOverview.welcome.goalCompleted} />/{weeklyGoalTarget}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <WelcomeMetric
              icon={Target}
              label="Questions Today"
              value={safeOverview.welcome.questionsToday}
              accent="purple"
            />
            <WelcomeMetric
              icon={Flame}
              label="Current Streak"
              value={`${safeOverview.welcome.currentStreak} Day${safeOverview.welcome.currentStreak === 1 ? "" : "s"}`}
              accent="orange"
            />
            <WelcomeMetric
              icon={Trophy}
              label="Current Level"
              value={`Level ${safeOverview.welcome.currentLevel}`}
              accent="amber"
            />
            <WelcomeMetric
              icon={Goal}
              label="Today's Goal"
              value={`${safeOverview.welcome.goalCompleted}/${weeklyGoalTarget}`}
              accent="emerald"
            />
          </div>
        </motion.div>

        <motion.div
          {...(shouldReduceMotion ? {} : CARD_MOTION)}
          className="h-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 xl:col-span-4"
        >
          <ModelStatusPanel
            modelStatus={modelStatus || safeOverview.modelStatus}
            switchingModel={switchingModel}
            setSwitchingModel={setSwitchingModel}
            setModelActionError={setModelActionError}
            setModelStatus={setModelStatus}
            modelActionError={modelActionError}
          />
        </motion.div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MetricCard
          title="Daily Streak"
          icon={Flame}
          iconBg="bg-orange-100"
          iconColor="text-orange-500"
          description="Consecutive days with at least one successful classification."
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <CircularProgress value={safeOverview.dailyStreak.progress} accent="orange" />
            <div className="w-full space-y-2">
              <MetricRow label="Current Streak" value={`${safeOverview.dailyStreak.current} Days`} />
              <MetricRow label="Last Activity" value={safeOverview.dailyStreak.lastActivityLabel} />
              <MetricRow label="Longest Streak" value={`${safeOverview.dailyStreak.longest} Days`} />
            </div>
          </div>
        </MetricCard>

        <MetricCard
          title="Weekly Goal"
          icon={Goal}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          description="Steady weekly classification progress."
        >
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-extrabold text-gray-900">
                  <AnimatedNumber value={safeOverview.weeklyGoal.completed} /> / {weeklyGoalTarget}
                </p>
                <p className="mt-1 text-sm text-gray-400">Questions Completed</p>
              </div>
              <p className="text-lg font-bold text-purple-600">
                <AnimatedNumber value={calculateGoalPercentage(safeOverview.weeklyGoal.completed, weeklyGoalTarget)} suffix="%" />
              </p>
            </div>
            <ProgressBar value={calculateGoalPercentage(safeOverview.weeklyGoal.completed, weeklyGoalTarget)} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Remaining: <span className="font-semibold text-gray-800">{Math.max(0, weeklyGoalTarget - safeOverview.weeklyGoal.completed)} Questions</span>
              </p>
              {!editingGoal ? (
                <button
                  type="button"
                  onClick={() => setEditingGoal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 px-3 py-1.5 text-xs font-semibold text-purple-600 transition-colors hover:bg-purple-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Goal
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={goalDraft}
                    onChange={(event) => setGoalDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSaveWeeklyGoal();
                      }

                      if (event.key === "Escape") {
                        event.preventDefault();
                        setGoalDraft(String(weeklyGoalTarget));
                        setEditingGoal(false);
                      }
                    }}
                    className="w-20 rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <button
                    type="button"
                    onClick={handleSaveWeeklyGoal}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-700"
                    aria-label="Save weekly goal"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGoalDraft(String(weeklyGoalTarget));
                      setEditingGoal(false);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
                    aria-label="Cancel weekly goal edit"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </MetricCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <MetricCard
          title="Achievements"
          icon={Trophy}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          description="Unlock milestones as you classify more questions."
          className="xl:col-span-2"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {safeOverview.achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
                className={`rounded-2xl border px-4 py-3 transition-all duration-200 ${
                  achievement.unlocked
                    ? "border-purple-100 bg-white shadow-sm"
                    : "border-gray-100 bg-gray-50 grayscale"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">{achievement.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{achievement.label}</p>
                    <p className="text-xs text-gray-400">
                      {achievement.unlocked ? "Unlocked" : "Locked"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </MetricCard>

        <MetricCard
          title="AI Insights"
          icon={Lightbulb}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          description="Smart summaries generated from your current dashboard data."
          className="xl:col-span-3"
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {safeOverview.insights.map((insight) => (
              <div
                key={insight}
                className="rounded-2xl border border-purple-100/70 bg-purple-50/60 px-4 py-3"
              >
                <p className="text-sm leading-relaxed text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </MetricCard>
      </section>
    </>
  );
}

function MetricCard({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  description,
  className = "",
  children,
}) {
  return (
    <div className={`h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-0.5 text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function WelcomeMetric({ icon: Icon, label, value, accent }) {
  const styles = {
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-500",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:px-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${styles[accent] || styles.purple}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">{label}</p>
      </div>
      <p className="mt-4 break-words text-[1.5rem] font-extrabold leading-none tracking-tight text-gray-900 sm:text-[1.65rem]">{value}</p>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-gray-400">{label}</span>
      <span className="break-words font-semibold text-gray-900 sm:text-right">{value}</span>
    </div>
  );
}

function ProgressBar({ value }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-purple-100">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
        initial={shouldReduceMotion ? false : { width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

function CircularProgress({ value, accent = "orange" }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const shouldReduceMotion = useReducedMotion();
  const stroke = accent === "orange" ? "#F97316" : "#A855F7";

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 64 64" className="h-20 w-20 -rotate-90">
        <circle cx="32" cy="32" r={radius} stroke="#F3E8FF" strokeWidth="6" fill="none" />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          stroke={stroke}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={shouldReduceMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-extrabold text-gray-900">
          <AnimatedNumber value={value} suffix="%" />
        </span>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const isOnline = status === "Online";
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
      isOnline
        ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
        : "border border-red-100 bg-red-50 text-red-500"
    }`}>
      <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-400"}`} />
      {status}
    </div>
  );
}

function ModelStatusPanel({
  modelStatus,
  switchingModel,
  setSwitchingModel,
  setModelActionError,
  setModelStatus,
  modelActionError,
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
          <Gauge className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">AI Model Status</h3>
          <p className="mt-0.5 text-sm text-gray-400">Switch models and check live health.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusPill status={modelStatus?.status} />
          {modelStatus?.canSwitchModels && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-400">
              Switch Model
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {(modelStatus?.models || []).map((model) => (
            <button
              key={model.key}
              type="button"
              disabled={!modelStatus?.canSwitchModels || switchingModel === model.key}
              onClick={async () => {
                if (!modelStatus?.canSwitchModels || model.isActive) return;
                setModelActionError("");
                setSwitchingModel(model.key);
                try {
                  const nextStatus = await updateDashboardModelStatus(model.key);
                  setModelStatus(nextStatus);
                } catch (error) {
                  setModelActionError(error?.message || "Could not switch model right now.");
                } finally {
                  setSwitchingModel("");
                }
              }}
              className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 ${
                model.isActive
                  ? "border-purple-200 bg-purple-50 shadow-sm"
                  : "border-gray-100 bg-gray-50/70"
              } ${modelStatus?.canSwitchModels ? "hover:border-purple-100 hover:bg-white" : "cursor-default"}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{model.label}</p>
                  {model.isActive && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-600">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-400">{model.model}</p>
              </div>
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                model.available
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              }`}>
                {switchingModel === model.key ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : model.available ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <TriangleAlert className="h-3 w-3" />
                )}
                {model.status}
              </div>
            </button>
          ))}
        </div>

        {modelActionError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {modelActionError}
          </div>
        )}

        <MetricRow label="Model" value={modelStatus?.modelLabel || modelStatus?.model} />
        <MetricRow
          label="Latency"
          value={modelStatus?.latencyMs ? `${modelStatus.latencyMs} ms` : "Unavailable"}
        />
        <MetricRow
          label="Average Confidence"
          value={`${modelStatus?.averageConfidence ?? 0}%`}
        />
        <MetricRow label="Requests Today" value={modelStatus?.requestsToday ?? 0} />
        <ProgressBar value={modelStatus?.progress ?? 0} />
      </div>
    </>
  );
}

function buildWeeklyGoalStorageKey(userName) {
  return `qdca:dashboard:weekly-goal:${String(userName || "default").trim().toLowerCase()}`;
}

function readSavedWeeklyGoal(storageKey) {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  } catch {
    return null;
  }
}

function sanitizeWeeklyGoal(value, fallbackValue) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallbackValue;
  return Math.min(500, Math.max(1, Math.round(numeric)));
}

function calculateGoalPercentage(completed, target) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((completed / target) * 100));
}

export default memo(DashboardEnhancements);

function normalizeOverview(overview) {
  const welcome = overview?.welcome ?? {};
  const dailyStreak = overview?.dailyStreak ?? {};
  const weeklyGoal = overview?.weeklyGoal ?? {};

  return {
    welcome: {
      greeting: asDisplayText(welcome.greeting, "Good Day"),
      userName: asDisplayText(welcome.userName, "Learner"),
      questionsToday: toNumber(welcome.questionsToday),
      currentStreak: toNumber(welcome.currentStreak),
      currentLevel: Math.max(1, toNumber(welcome.currentLevel, 1)),
      goalCompleted: toNumber(welcome.goalCompleted),
      goalTarget: Math.max(1, toNumber(welcome.goalTarget, 10)),
    },
    dailyStreak: {
      current: toNumber(dailyStreak.current),
      longest: toNumber(dailyStreak.longest),
      lastActivity: dailyStreak.lastActivity ?? null,
      lastActivityLabel: asDisplayText(dailyStreak.lastActivityLabel, "No recent activity"),
      progress: clampPercentage(dailyStreak.progress),
    },
    weeklyGoal: {
      completed: toNumber(weeklyGoal.completed),
      target: Math.max(1, toNumber(weeklyGoal.target, 10)),
      remaining: Math.max(0, toNumber(weeklyGoal.remaining, 0)),
      percentage: clampPercentage(weeklyGoal.percentage),
    },
    achievements: normalizeAchievements(overview?.achievements),
    insights: normalizeInsights(overview?.insights),
    modelStatus: normalizeModelStatus(overview?.modelStatus),
  };
}

function normalizeModelStatus(modelStatus) {
  if (!modelStatus || typeof modelStatus !== "object") {
    return {
      status: "Offline",
      model: "",
      modelLabel: "Unavailable",
      activeModel: "",
      latencyMs: null,
      averageConfidence: 0,
      requestsToday: 0,
      progress: 0,
      canSwitchModels: false,
      models: [],
    };
  }

  return {
    status: asDisplayText(modelStatus.status, "Offline"),
    model: asDisplayText(modelStatus.model, ""),
    modelLabel: asDisplayText(modelStatus.modelLabel, asDisplayText(modelStatus.model, "Unavailable")),
    activeModel: asDisplayText(modelStatus.activeModel, ""),
    latencyMs: typeof modelStatus.latencyMs === "number" ? modelStatus.latencyMs : null,
    averageConfidence: clampPercentage(modelStatus.averageConfidence),
    requestsToday: toNumber(modelStatus.requestsToday),
    progress: clampPercentage(modelStatus.progress),
    canSwitchModels: Boolean(modelStatus.canSwitchModels),
    models: normalizeModelOptions(modelStatus.models),
  };
}

function normalizeAchievements(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(item => item && typeof item === "object")
    .map((item, index) => ({
      id: typeof item.id === "string" && item.id.trim() ? item.id : `achievement-${index}`,
      label: asDisplayText(item.label, "Achievement"),
      icon: asDisplayText(item.icon, "🏆"),
      unlocked: Boolean(item.unlocked),
    }));
}

function normalizeInsights(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(item => typeof item === "string")
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeModelOptions(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(item => item && typeof item === "object")
    .map((item, index) => ({
      key: typeof item.key === "string" && item.key.trim() ? item.key : `model-${index}`,
      label: asDisplayText(item.label, "Model"),
      model: asDisplayText(item.model, ""),
      available: Boolean(item.available),
      status: asDisplayText(item.status, "Offline"),
      isActive: Boolean(item.isActive),
    }));
}

function asDisplayText(value, fallback = "") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampPercentage(value) {
  return Math.max(0, Math.min(100, toNumber(value)));
}
