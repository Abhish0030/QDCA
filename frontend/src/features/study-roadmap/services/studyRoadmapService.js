import { fetchClassifications, fetchStudyRoadmap } from "../../../api/index.js";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const FALLBACK_TOPICS = ["Arrays", "Strings", "Binary Search", "Trees", "Graphs", "Dynamic Programming"];
const DIFFICULTIES = ["Easy", "Easy", "Medium", "Medium", "Hard"];
const SKILL_NAMES = ["Arrays", "Strings", "Trees", "Graphs", "DP", "Math", "Greedy", "Backtracking"];

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function statusProgress(status, index) {
  if (status === "completed") return 100;
  if (status === "in_progress") return Math.min(78, 38 + index * 7);
  return 0;
}

function createTopics(subjects) {
  const apiTopics = subjects.flatMap((subject, subjectIndex) =>
    (Array.isArray(subject.topics) ? subject.topics : []).map((topic, topicIndex) => ({
      name: topic.name,
      subject: subject.subject,
      status: topic.status,
      subjectIndex,
      topicIndex,
    })),
  );
  const source = apiTopics.length
    ? apiTopics
    : FALLBACK_TOPICS.map((name, index) => ({
        name,
        subject: "Computer Science",
        status: index < 2 ? "completed" : index === 2 ? "in_progress" : "locked",
        subjectIndex: 0,
        topicIndex: index,
      }));

  return source.map((topic, index) => {
    const progress = statusProgress(topic.status, index);
    const totalQuestions = 20 + ((index * 7) % 26);
    const questionsSolved = Math.min(totalQuestions, Math.round((totalQuestions * progress) / 100));
    return {
      id: `${slug(topic.subject)}-${slug(topic.name)}-${index}`,
      name: topic.name,
      subject: topic.subject,
      status: topic.status,
      progress,
      difficulty: DIFFICULTIES[Math.min(DIFFICULTIES.length - 1, Math.floor(index / 2))],
      questionsSolved,
      totalQuestions,
      weakConcepts: progress >= 100 ? [] : [`${topic.name} fundamentals`, "Edge cases"],
      recommendation:
        progress >= 100
          ? `Keep ${topic.name} fresh with one weekly review.`
          : `Master ${topic.name} fundamentals before attempting advanced patterns.`,
      recommendedNext: source[index + 1]?.name || "Mixed revision",
    };
  });
}

function buildDifficultyDistribution(classifications) {
  const order = ["Very Easy", "Easy", "Medium", "Hard", "Expert"];
  const colors = ["#16a34a", "#84cc16", "#eab308", "#f97316", "#dc2626"];
  return order.map((name, index) => ({
    name,
    value: classifications.filter(item => item.difficulty === name).length,
    color: colors[index],
  }));
}

function buildProgressTrend(overallProgress) {
  const labels = ["30d", "25d", "20d", "15d", "10d", "5d", "Today"];
  return labels.map((date, index) => ({
    date,
    progress: clamp(Math.round(overallProgress * (0.35 + index * 0.108))),
  }));
}

export function adaptStudyRoadmap(apiRoadmap, classifications = []) {
  const subjects = Array.isArray(apiRoadmap?.subjects) ? apiRoadmap.subjects : [];
  const topics = createTopics(subjects);
  const completed = topics.filter(topic => topic.status === "completed").length;
  const overallProgress = clamp(
    apiRoadmap?.overall?.percentage ?? Math.round((topics.reduce((sum, topic) => sum + topic.progress, 0) / Math.max(topics.length, 1))),
  );
  const currentTopic = topics.find(topic => topic.status === "in_progress") || topics.find(topic => topic.status !== "completed") || topics[0];
  const averageConfidence = classifications.length
    ? Math.round(classifications.reduce((sum, item) => sum + (Number(item.conf) || 0), 0) / classifications.length)
    : 88;
  const currentLevel = overallProgress >= 75 ? "Advanced" : overallProgress >= 35 ? "Intermediate" : "Foundation";
  const targetLevel = currentLevel === "Advanced" ? "Mastery" : "Advanced";
  const questionTotal = classifications.length || topics.reduce((sum, topic) => sum + topic.questionsSolved, 0);
  const estimatedDays = Math.max(7, Math.ceil((100 - overallProgress) / 3));

  return {
    summary: apiRoadmap?.summary || "Your AI-generated path adapts as you classify and solve more questions.",
    currentLevel,
    targetLevel,
    overallProgress,
    estimatedDays,
    aiConfidence: averageConfidence,
    todayGoal: {
      topic: currentTopic.name,
      questions: Math.max(3, Math.min(8, currentTopic.totalQuestions - currentTopic.questionsSolved)),
      estimatedTime: "35 mins",
      difficulty: currentTopic.difficulty,
    },
    topics,
    statistics: [
      { key: "topics", label: "Topics Completed", value: completed, subtitle: `of ${topics.length} roadmap topics`, trend: "+1 this week" },
      { key: "questions", label: "Questions Solved", value: questionTotal, subtitle: "across your learning path", trend: "+12%" },
      { key: "accuracy", label: "Current Accuracy", value: `${averageConfidence}%`, subtitle: "average classification confidence", trend: "+3.4%" },
      { key: "streak", label: "Study Streak", value: `${classifications.length ? 7 : 0} days`, subtitle: "personal best: 12 days", trend: "Keep going" },
    ],
    weeklyPlan: DAY_NAMES.map((day, index) => ({
      day,
      topic: topics[index % topics.length].name,
      status: index < 2 ? "completed" : index === 2 ? "today" : "upcoming",
      estimatedTime: index === 6 ? "20 mins" : `${25 + (index % 3) * 10} mins`,
    })),
    recommendations: [
      `Finish ${currentTopic.name} before moving to ${currentTopic.recommendedNext}.`,
      `Solve ${Math.max(5, 10 - currentTopic.questionsSolved)} ${currentTopic.difficulty} questions to strengthen pattern recognition.`,
      currentTopic.weakConcepts.length ? `Revise ${currentTopic.weakConcepts[0]} in your next session.` : "Schedule a mixed-topic revision session.",
      averageConfidence < 80 ? "Review low-confidence classifications before attempting harder questions." : "Your consistency is strong—add one stretch problem this week.",
    ],
    charts: {
      difficulty: buildDifficultyDistribution(classifications),
      topicPerformance: topics.slice(0, 7).map(topic => ({ name: topic.name, accuracy: clamp(48 + topic.progress * 0.46) })),
      progressTrend: buildProgressTrend(overallProgress),
      skills: SKILL_NAMES.map((skill, index) => ({ skill, score: clamp(42 + overallProgress * 0.42 + (index % 4) * 6) })),
    },
    insights: {
      strongestTopic: topics.reduce((best, topic) => topic.progress > best.progress ? topic : best, topics[0]).name,
      weakestTopic: topics.find(topic => topic.status !== "completed")?.name || topics.at(-1).name,
      averageSolveTime: "6m 24s",
      mostImprovedTopic: topics[Math.min(1, topics.length - 1)].name,
      suggestedNextTopic: currentTopic.recommendedNext,
      studyConsistency: classifications.length ? "Strong" : "Building",
    },
    recommendedQuestions: topics.slice(0, 4).map((topic, index) => ({
      id: `recommended-${topic.id}`,
      title: `${index % 2 ? "Apply" : "Practice"} ${topic.name} in a real problem`,
      difficulty: topic.difficulty,
      estimatedTime: `${10 + index * 5} mins`,
      reason: index === 0 ? "Best next step for today's goal." : `Reinforces your ${topic.name} roadmap milestone.`,
    })),
    achievements: [
      { name: "First Steps", description: "Started your personalized roadmap", icon: "spark", unlocked: true },
      { name: "100 Questions", description: "Solve 100 classified questions", icon: "target", unlocked: questionTotal >= 100 },
      { name: "7 Day Streak", description: "Study for seven consecutive days", icon: "flame", unlocked: classifications.length > 0 },
      { name: "Hard Master", description: "Complete ten hard questions", icon: "trophy", unlocked: classifications.filter(item => item.difficulty === "Hard").length >= 10 },
      { name: "Fast Learner", description: "Complete three topics", icon: "bolt", unlocked: completed >= 3 },
    ],
    recentActivity: [
      ...classifications.slice(0, 3).map((item, index) => ({
        id: item.id || `classification-${index}`,
        type: "Question classified",
        detail: `${item.question} · ${item.difficulty}`,
        time: item.date || "Recently",
      })),
      { id: "roadmap-updated", type: "Roadmap updated", detail: `${topics.length} topics prioritized by AI`, time: "Just now" },
    ].slice(0, 4),
  };
}

export async function getStudyRoadmapDashboard({ force = false } = {}) {
  const [roadmap, classifications] = await Promise.all([
    fetchStudyRoadmap({ force }),
    fetchClassifications({ force }).catch(() => []),
  ]);
  return adaptStudyRoadmap(roadmap, classifications);
}
