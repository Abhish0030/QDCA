import type { Prisma } from "@prisma/client";
import { prisma } from "../../../database";
import { AppError } from "../../../shared/utils/app-error";
import {
  createTrendBuckets,
  fillTrendBuckets,
  getDifficultyDistribution,
  type TrendRange,
} from "../../dashboard/services/dashboard-service";
import { updateUserContribution } from "../../leaderboard/services/leaderboard-service";
import { listAdminUploadJobs, retryUploadJobIndexing } from "../../uploads/services/upload-job-service";

const DIFFICULTY_COLORS: Record<string, string> = {
  "Very Easy": "#22c55e",
  Easy: "#84cc16",
  Medium: "#eab308",
  Hard: "#f97316",
  Expert: "#ef4444",
};

const SUBJECT_KEYWORDS: Array<{ subject: string; patterns: RegExp[] }> = [
  { subject: "Math", patterns: [/\b(algebra|matrix|geometry|calculus|integral|equation|quadratic)\b/i] },
  { subject: "Physics", patterns: [/\b(force|energy|motion|kinetic|newton|velocity|electric)\b/i] },
  { subject: "Chem", patterns: [/\b(chemical|molecule|atom|glucose|reaction|acid|base)\b/i] },
  { subject: "Biology", patterns: [/\b(cell|photosynthesis|enzyme|genetics|organism|ecosystem)\b/i] },
  { subject: "English", patterns: [/\b(grammar|passage|essay|literature|synonym|antonym)\b/i] },
];

export async function getAdminStats() {
  const today = startOfDay(new Date());
  const [totalUsers, totalQuestions, activeSessions, uploadCount, accuracy] = await Promise.all([
    prisma.user.count(),
    prisma.question.count(),
    prisma.session.findMany({
      where: { updatedAt: { gte: today } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.ragDocumentChunk.findMany({
      where: { source: { not: null } },
      select: { source: true },
      distinct: ["source"],
    }),
    prisma.question.aggregate({ _avg: { confidence: true } }),
  ]);

  return {
    totalUsers,
    totalQuestions,
    totalUploads: uploadCount.length,
    activeToday: activeSessions.length,
    modelAccuracy: roundNumber(accuracy._avg.confidence),
  };
}

export async function getAdminActivity(range: TrendRange) {
  const buckets = createTrendBuckets(range, new Date());
  const questions = await prisma.question.findMany({
    where: { createdAt: { gte: buckets[0]?.start } },
    select: { createdAt: true },
  });

  return fillTrendBuckets(buckets, questions);
}

export async function getAdminDifficulty() {
  const distribution = await getDifficultyDistribution();
  return [
    { name: "Very Easy", value: distribution.veryEasy, color: DIFFICULTY_COLORS["Very Easy"] },
    { name: "Easy", value: distribution.easy, color: DIFFICULTY_COLORS.Easy },
    { name: "Medium", value: distribution.medium, color: DIFFICULTY_COLORS.Medium },
    { name: "Hard", value: distribution.hard, color: DIFFICULTY_COLORS.Hard },
    { name: "Expert", value: distribution.expert, color: DIFFICULTY_COLORS.Expert },
  ];
}

export async function getRecentSignups() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    joinedAt: formatDisplayDate(user.createdAt),
    avatarInitial: user.name.charAt(0).toUpperCase(),
  }));
}

export async function getRecentActions() {
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { actor: { select: { name: true } } },
  });

  return logs.map((log) => ({
    id: log.id,
    admin: log.actor.name,
    adminName: log.actor.name,
    action: log.action,
    target: log.target ?? "Platform",
    targetUser: log.target ?? "Platform",
    timestamp: log.createdAt.toISOString(),
  }));
}

export async function getAdminUsers(input: {
  search?: string;
  role?: string;
  status?: string;
  page: number;
  limit: number;
}) {
  const where: Prisma.UserWhereInput = {
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(input.role && input.role !== "all" ? { role: input.role } : {}),
    ...(input.status && input.status !== "all" ? { status: input.status } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      include: {
        sessions: { orderBy: { updatedAt: "desc" }, take: 1 },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      joinedAt: formatDisplayDate(user.createdAt),
      lastActive: user.sessions[0]?.updatedAt
        ? formatDisplayDate(user.sessions[0].updatedAt)
        : "Never",
      avatarInitial: user.name.charAt(0).toUpperCase(),
    })),
    total,
    page: input.page,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
  };
}

export async function getAdminUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      sessions: { orderBy: { updatedAt: "desc" }, take: 1 },
      _count: { select: { questions: true, uploadJobs: true } },
    },
  });

  if (!user) return null;

  const accuracy = await prisma.question.aggregate({
    where: { createdById: id },
    _avg: { confidence: true },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      joinedAt: formatDisplayDate(user.createdAt),
      lastActive: user.sessions[0]?.updatedAt
        ? formatDisplayDate(user.sessions[0].updatedAt)
        : "Never",
      avatarInitial: user.name.charAt(0).toUpperCase(),
    },
    stats: {
      questions: user._count.questions,
      accuracy: roundNumber(accuracy._avg.confidence),
      uploads: user._count.uploadJobs,
      accountStatus: user.status,
    },
  };
}

export async function updateAdminUser(
  actorId: string,
  id: string,
  data: { role?: "admin" | "user"; status?: "active" | "suspended" },
) {
  return prisma.$transaction(async (transaction) => {
    const existingUser = await transaction.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    const isSelfTarget = existingUser.id === actorId;
    const isRoleDemotion =
      existingUser.role === "admin" && data.role !== undefined && data.role !== "admin";
    const isStatusSuspension =
      existingUser.role === "admin" &&
      existingUser.status === "active" &&
      data.status !== undefined &&
      data.status !== "active";

    if (isSelfTarget && data.role !== undefined && data.role !== "admin") {
      throw new AppError("You cannot remove your own admin role", 400);
    }

    if (isSelfTarget && data.status !== undefined && data.status !== "active") {
      throw new AppError("You cannot suspend your own account", 400);
    }

    if (isRoleDemotion || isStatusSuspension) {
      const remainingActiveAdmins = await transaction.user.count({
        where: {
          id: { not: existingUser.id },
          role: "admin",
          status: "active",
        },
      });

      if (remainingActiveAdmins === 0) {
        throw new AppError("At least one active admin must remain", 400);
      }
    }

    const user = await transaction.user.update({
      where: { id },
      data,
      include: {
        sessions: { orderBy: { updatedAt: "desc" }, take: 1 },
      },
    });

    await transaction.adminAuditLog.create({
      data: {
        actorId,
        action: data.role ? `Changed role to ${data.role}` : `Changed status to ${data.status}`,
        target: user.email,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      joinedAt: formatDisplayDate(user.createdAt),
      lastActive: user.sessions[0]?.updatedAt
        ? formatDisplayDate(user.sessions[0].updatedAt)
        : "Never",
      avatarInitial: user.name.charAt(0).toUpperCase(),
    };
  });
}

export async function deleteAdminUser(actorId: string, id: string) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUniqueOrThrow({ where: { id } });
    await transaction.adminAuditLog.create({
      data: { actorId, action: "Deleted user", target: user.email },
    });
    await transaction.user.delete({ where: { id } });
  });
}

export async function getAdminQuestions(input: {
  filter?: string;
  page: number;
  limit: number;
}) {
  const settings = await prisma.adminSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  const threshold = Math.round((settings.confidenceThreshold || 0.55) * 100);

  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
    },
  });

  const normalized = questions.map((question) => ({
    id: question.id,
    text: question.content || question.title,
    difficulty: formatDifficultyLabel(question.difficulty),
    confidence: roundNumber(question.confidence),
    submittedBy: question.createdBy?.name ?? "Unknown User",
    date: formatDisplayDate(question.createdAt),
    flagged: roundNumber(question.confidence) < threshold,
  }));

  const filtered = normalized.filter((question) => {
    if (!input.filter || input.filter === "all") return true;
    if (input.filter === "flagged") return question.flagged;
    return question.difficulty.toLowerCase() === input.filter.toLowerCase();
  });

  return {
    questions: filtered.slice((input.page - 1) * input.limit, input.page * input.limit),
    total: filtered.length,
  };
}

export async function overrideQuestion(actorId: string, id: string, difficulty: string) {
  return prisma.$transaction(async (transaction) => {
    const question = await transaction.question.update({
      where: { id },
      data: {
        difficulty: difficulty.toLowerCase().replace(/\s+/g, "_"),
        confidence: 0.99,
      },
    });

    await transaction.adminAuditLog.create({
      data: {
        actorId,
        action: "Overrode difficulty",
        target: question.title,
      },
    });

    if (question.createdById) {
      await updateUserContribution(transaction, {
        userId: question.createdById,
        points: 0,
      });
    }

    return {
      id: question.id,
      difficulty: formatDifficultyLabel(question.difficulty),
      confidence: roundNumber(question.confidence),
    };
  });
}

export async function getAdminUploads(page: number, limit: number) {
  return listAdminUploadJobs(page, limit);
}

export async function verifyAdminUpload(id: string) {
  return retryUploadJobIndexing(id);
}

export async function getAdminAnalytics(_range?: TrendRange) {
  const [users, questions] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.question.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        title: true,
        content: true,
        difficulty: true,
        confidence: true,
      },
    }),
  ]);

  return {
    difficultyBySubject: buildDifficultyBySubject(questions),
    userGrowth: buildUserGrowth(users),
    confidenceTrend: buildConfidenceTrend(questions),
    peakHours: buildPeakHours(questions),
  };
}

export async function getAdminSettings() {
  return prisma.adminSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

export async function updateAdminSettings(
  actorId: string,
  data: {
    aiModel?: string;
    confidenceThreshold?: number;
    maintenanceMode?: boolean;
    signupsEnabled?: boolean;
  },
) {
  return prisma.$transaction(async (transaction) => {
    const settings = await transaction.adminSetting.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });

    await transaction.adminAuditLog.create({
      data: {
        actorId,
        action: "Updated admin settings",
        target: "Platform Settings",
      },
    });

    return settings;
  });
}

function buildDifficultyBySubject(
  questions: Array<{ title: string; content: string | null; difficulty: string | null }>,
) {
  const bucket = new Map<string, { subject: string; easy: number; medium: number; hard: number }>();

  for (const question of questions) {
    const subject = detectSubject(question.title, question.content);
    const record = bucket.get(subject) ?? { subject, easy: 0, medium: 0, hard: 0 };
    const difficulty = formatDifficultyLabel(question.difficulty);

    if (difficulty === "Easy" || difficulty === "Very Easy") {
      record.easy += 1;
    } else if (difficulty === "Medium") {
      record.medium += 1;
    } else {
      record.hard += 1;
    }

    bucket.set(subject, record);
  }

  return bucket.size > 0 ? [...bucket.values()] : [{ subject: "Math", easy: 0, medium: 0, hard: 0 }];
}

function buildUserGrowth(users: Array<{ createdAt: Date }>) {
  const months = new Map<string, number>();

  for (const user of users) {
    const key = user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    months.set(key, (months.get(key) ?? 0) + 1);
  }

  let running = 0;
  return [...months.entries()].map(([date, count]) => {
    running += count;
    return { date: date.split(" ")[0], count: running };
  });
}

function buildConfidenceTrend(questions: Array<{ createdAt: Date; confidence: number | null }>) {
  const recent = questions.slice(-7);
  return recent.map((question) => ({
    date: formatShortDate(question.createdAt),
    avg: roundNumber(question.confidence),
  }));
}

function buildPeakHours(questions: Array<{ createdAt: Date }>) {
  const hours = new Map<number, number>();

  for (const question of questions) {
    const hour = question.createdAt.getHours();
    hours.set(hour, (hours.get(hour) ?? 0) + 1);
  }

  return [...hours.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([hour, count]) => ({
      hour: `${((hour + 11) % 12) + 1}${hour >= 12 ? "PM" : "AM"}`,
      count,
    }));
}

function detectSubject(title: string, content: string | null) {
  const source = `${title} ${content ?? ""}`;
  for (const candidate of SUBJECT_KEYWORDS) {
    if (candidate.patterns.some((pattern) => pattern.test(source))) {
      return candidate.subject;
    }
  }
  return "General";
}

function formatDifficultyLabel(value: string | null) {
  if (!value) return "Medium";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDisplayDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(value: Date) {
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function roundNumber(value: number | null | undefined) {
  return Math.round(Number(value ?? 0));
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
