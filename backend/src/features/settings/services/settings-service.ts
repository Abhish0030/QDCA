import { prisma } from "../../../database";
import { AppError } from "../../../shared/utils/app-error";

const PROFILE_DEFAULTS = {
	username: "",
	phone: "",
	university: "",
	department: "",
	degree: "",
	semester: "",
	bio: "",
	country: "",
	timezone: "Asia/Kolkata",
	language: "English",
};

const AI_PREFERENCES_DEFAULTS = {
	defaultAiModel: "auto",
	responseLength: "balanced",
	temperature: 0.2,
	explanationLevel: "detailed",
	difficultyStyle: "adaptive",
	markdownOutput: true,
	codeOutput: true,
	studyMode: "smart",
	autoSaveHistory: true,
	language: "English",
};

const NOTIFICATION_DEFAULTS = {
	emailNotifications: true,
	pushNotifications: true,
	weeklyReports: true,
	analysisCompletion: true,
	studyReminders: false,
	leaderboardUpdates: true,
	securityAlerts: true,
	productUpdates: false,
};

const PRIVACY_DEFAULTS = {
	profileVisibility: "private",
	analyticsEnabled: true,
	recommendationsEnabled: true,
	activityVisibility: "private",
};

const SECURITY_DEFAULTS = {
	twoFactorEnabled: false,
	recoveryEmail: "",
	recoveryPhone: "",
	lastPasswordChangeAt: null as string | null,
};

export async function getSettingsView(userId: string, currentSessionId?: string) {
	const [user, settings, sessions] = await Promise.all([
		prisma.user.findUniqueOrThrow({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				role: true,
				status: true,
				createdAt: true,
			},
		}),
		ensureSettings(userId),
		prisma.session.findMany({
			where: { userId },
			orderBy: { updatedAt: "desc" },
			take: 8,
			select: {
				id: true,
				createdAt: true,
				updatedAt: true,
				expiresAt: true,
				ipAddress: true,
				userAgent: true,
			},
		}),
	]);

	const questionCount = await prisma.question.count({ where: { createdById: userId } });
	const uploadCount = await prisma.ragDocumentChunk.count({ where: { userId } });

	return {
		profile: {
			name: user.name,
			email: user.email,
			image: user.image ?? "",
			username: settings.username ?? PROFILE_DEFAULTS.username,
			phone: settings.phone ?? PROFILE_DEFAULTS.phone,
			university: settings.university ?? PROFILE_DEFAULTS.university,
			department: settings.department ?? PROFILE_DEFAULTS.department,
			degree: settings.degree ?? PROFILE_DEFAULTS.degree,
			semester: settings.semester ?? PROFILE_DEFAULTS.semester,
			bio: settings.bio ?? PROFILE_DEFAULTS.bio,
			country: settings.country ?? PROFILE_DEFAULTS.country,
			timezone: settings.timezone ?? PROFILE_DEFAULTS.timezone,
			language: settings.language ?? PROFILE_DEFAULTS.language,
		},
		aiPreferences: {
			defaultAiModel: settings.defaultAiModel ?? AI_PREFERENCES_DEFAULTS.defaultAiModel,
			responseLength: settings.responseLength ?? AI_PREFERENCES_DEFAULTS.responseLength,
			temperature: settings.temperature ?? AI_PREFERENCES_DEFAULTS.temperature,
			explanationLevel: settings.explanationLevel ?? AI_PREFERENCES_DEFAULTS.explanationLevel,
			difficultyStyle: settings.difficultyStyle ?? AI_PREFERENCES_DEFAULTS.difficultyStyle,
			markdownOutput: settings.markdownOutput ?? AI_PREFERENCES_DEFAULTS.markdownOutput,
			codeOutput: settings.codeOutput ?? AI_PREFERENCES_DEFAULTS.codeOutput,
			studyMode: settings.studyMode ?? AI_PREFERENCES_DEFAULTS.studyMode,
			language: settings.language ?? AI_PREFERENCES_DEFAULTS.language,
			autoSaveHistory: settings.autoSaveHistory ?? AI_PREFERENCES_DEFAULTS.autoSaveHistory,
		},
		notifications: {
			email: settings.emailNotifications ?? NOTIFICATION_DEFAULTS.emailNotifications,
			push: settings.pushNotifications ?? NOTIFICATION_DEFAULTS.pushNotifications,
			weeklyReports: settings.weeklyReports ?? NOTIFICATION_DEFAULTS.weeklyReports,
			analysisCompletion: settings.analysisCompletion ?? NOTIFICATION_DEFAULTS.analysisCompletion,
			studyReminders: settings.studyReminders ?? NOTIFICATION_DEFAULTS.studyReminders,
			leaderboardUpdates: settings.leaderboardUpdates ?? NOTIFICATION_DEFAULTS.leaderboardUpdates,
			securityAlerts: settings.securityAlerts ?? NOTIFICATION_DEFAULTS.securityAlerts,
			productUpdates: settings.productUpdates ?? NOTIFICATION_DEFAULTS.productUpdates,
		},
		privacy: {
			profileVisibility: settings.profileVisibility ?? PRIVACY_DEFAULTS.profileVisibility,
			analytics: settings.analyticsEnabled ?? PRIVACY_DEFAULTS.analyticsEnabled,
			recommendations: settings.recommendationsEnabled ?? PRIVACY_DEFAULTS.recommendationsEnabled,
			activityVisibility: settings.activityVisibility ?? PRIVACY_DEFAULTS.activityVisibility,
		},
		security: {
			twoFactorEnabled: settings.twoFactorEnabled ?? SECURITY_DEFAULTS.twoFactorEnabled,
			recoveryEmail: settings.recoveryEmail ?? SECURITY_DEFAULTS.recoveryEmail,
			recoveryPhone: settings.recoveryPhone ?? SECURITY_DEFAULTS.recoveryPhone,
			lastPasswordChangeAt:
				settings.lastPasswordChangeAt?.toISOString() ?? SECURITY_DEFAULTS.lastPasswordChangeAt,
			recentSessions: sessions.map((session: (typeof sessions)[number]) => ({
				id: session.id,
				current: session.id === currentSessionId,
				ipAddress: session.ipAddress ?? "Unknown",
				userAgent: session.userAgent ?? "Unknown device",
				lastActiveAt: session.updatedAt.toISOString(),
				createdAt: session.createdAt.toISOString(),
				expiresAt: session.expiresAt.toISOString(),
			})),
		},
		account: {
			id: user.id,
			role: user.role,
			status: user.status,
			joinedAt: user.createdAt.toISOString(),
			questionCount,
			uploadCount,
		},
	};
}

export async function updateProfileSettings(
	userId: string,
	input: {
		name: string;
		email: string;
		username: string;
		phone: string;
		university: string;
		department: string;
		degree: string;
		semester: string;
		bio: string;
		country: string;
		timezone: string;
		language: string;
	},
) {
	const existing = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		select: { email: true },
	});

	if (input.email.toLowerCase() !== existing.email.toLowerCase()) {
		const emailOwner = await prisma.user.findUnique({
			where: { email: input.email },
			select: { id: true },
		});

		if (emailOwner && emailOwner.id !== userId) {
			throw new AppError("That email address is already in use.", 409);
		}
	}

	if (input.username) {
		const usernameOwner = await prisma.userSettings.findFirst({
			where: {
				username: input.username,
				NOT: { userId },
			},
			select: { id: true },
		});

		if (usernameOwner) {
			throw new AppError("That username is already taken.", 409);
		}
	}

	const [user] = await prisma.$transaction([
		prisma.user.update({
			where: { id: userId },
			data: {
				name: input.name,
				email: input.email,
			},
			select: {
				name: true,
				email: true,
				image: true,
			},
		}),
		prisma.account.updateMany({
			where: {
				userId,
				providerId: "credential",
				accountId: existing.email,
			},
			data: {
				accountId: input.email,
			},
		}),
		prisma.userSettings.upsert({
			where: { userId },
			create: {
				userId,
				username: nullable(input.username),
				phone: nullable(input.phone),
				university: nullable(input.university),
				department: nullable(input.department),
				degree: nullable(input.degree),
				semester: nullable(input.semester),
				bio: nullable(input.bio),
				country: nullable(input.country),
				timezone: nullable(input.timezone),
				language: input.language,
			},
			update: {
				username: nullable(input.username),
				phone: nullable(input.phone),
				university: nullable(input.university),
				department: nullable(input.department),
				degree: nullable(input.degree),
				semester: nullable(input.semester),
				bio: nullable(input.bio),
				country: nullable(input.country),
				timezone: nullable(input.timezone),
				language: input.language,
			},
		}),
	]);

	return {
		...input,
		image: user.image ?? "",
	};
}

export async function updateAiPreferences(
	userId: string,
	input: {
		defaultAiModel: string;
		responseLength: string;
		temperature: number;
		explanationLevel: string;
		difficultyStyle: string;
		markdownOutput: boolean;
		codeOutput: boolean;
		studyMode: string;
		language: string;
		autoSaveHistory: boolean;
	},
) {
	await prisma.userSettings.upsert({
		where: { userId },
		create: { userId, ...input },
		update: { ...input },
	});
	return input;
}

export async function updateNotificationSettings(
	userId: string,
	input: {
		email: boolean;
		push: boolean;
		weeklyReports: boolean;
		analysisCompletion: boolean;
		studyReminders: boolean;
		leaderboardUpdates: boolean;
		securityAlerts: boolean;
		productUpdates: boolean;
	},
) {
	await prisma.userSettings.upsert({
		where: { userId },
		create: {
			userId,
			emailNotifications: input.email,
			pushNotifications: input.push,
			weeklyReports: input.weeklyReports,
			analysisCompletion: input.analysisCompletion,
			studyReminders: input.studyReminders,
			leaderboardUpdates: input.leaderboardUpdates,
			securityAlerts: input.securityAlerts,
			productUpdates: input.productUpdates,
		},
		update: {
			emailNotifications: input.email,
			pushNotifications: input.push,
			weeklyReports: input.weeklyReports,
			analysisCompletion: input.analysisCompletion,
			studyReminders: input.studyReminders,
			leaderboardUpdates: input.leaderboardUpdates,
			securityAlerts: input.securityAlerts,
			productUpdates: input.productUpdates,
		},
	});
	return input;
}

export async function updatePrivacySettings(
	userId: string,
	input: {
		profileVisibility: string;
		analytics: boolean;
		recommendations: boolean;
		activityVisibility: string;
	},
) {
	await prisma.userSettings.upsert({
		where: { userId },
		create: {
			userId,
			profileVisibility: input.profileVisibility,
			analyticsEnabled: input.analytics,
			recommendationsEnabled: input.recommendations,
			activityVisibility: input.activityVisibility,
		},
		update: {
			profileVisibility: input.profileVisibility,
			analyticsEnabled: input.analytics,
			recommendationsEnabled: input.recommendations,
			activityVisibility: input.activityVisibility,
		},
	});
	return input;
}

export async function updateRecoverySettings(
	userId: string,
	input: {
		recoveryEmail: string;
		recoveryPhone: string;
	},
) {
	await prisma.userSettings.upsert({
		where: { userId },
		create: {
			userId,
			recoveryEmail: nullable(input.recoveryEmail),
			recoveryPhone: nullable(input.recoveryPhone),
		},
		update: {
			recoveryEmail: nullable(input.recoveryEmail),
			recoveryPhone: nullable(input.recoveryPhone),
		},
	});
	return input;
}

export async function recordPasswordChange(userId: string) {
	await prisma.userSettings.upsert({
		where: { userId },
		create: {
			userId,
			lastPasswordChangeAt: new Date(),
		},
		update: {
			lastPasswordChangeAt: new Date(),
		},
	});
}

export async function storeAvatar(userId: string, image: string) {
	const user = await prisma.user.update({
		where: { id: userId },
		data: { image },
		select: { image: true },
	});
	return user.image ?? "";
}

export async function removeAvatar(userId: string) {
	await prisma.user.update({
		where: { id: userId },
		data: { image: null },
	});
}

export async function exportUserData(userId: string) {
	const [user, settings, sessions, questions, notifications, activities] = await Promise.all([
		prisma.user.findUniqueOrThrow({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				role: true,
				status: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		ensureSettings(userId),
		prisma.session.findMany({
			where: { userId },
			orderBy: { updatedAt: "desc" },
			select: {
				id: true,
				createdAt: true,
				updatedAt: true,
				expiresAt: true,
				ipAddress: true,
				userAgent: true,
			},
		}),
		prisma.question.findMany({
			where: { createdById: userId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				title: true,
				difficulty: true,
				confidence: true,
				createdAt: true,
			},
		}),
		prisma.notification.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				type: true,
				title: true,
				message: true,
				createdAt: true,
			},
		}),
		prisma.activityLog.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				actionType: true,
				description: true,
				metadata: true,
				createdAt: true,
			},
		}),
	]);

	return {
		exportedAt: new Date().toISOString(),
		user,
		settings,
		sessions,
		questions,
		notifications,
		activities,
	};
}

export async function clearUserData(
	userId: string,
	target: "chat" | "analysis" | "history" | "all",
) {
	if (target === "chat") {
		return { deletedQuestions: 0, deletedActivities: 0, deletedNotifications: 0 };
	}

	const deleteQuestions = target === "analysis" || target === "history" || target === "all";
	const deleteActivities = target === "history" || target === "all";
	const deleteNotifications = target === "all";

	const [questionsResult, activitiesResult, notificationsResult] = await prisma.$transaction([
		deleteQuestions
			? prisma.question.deleteMany({ where: { createdById: userId } })
			: prisma.question.deleteMany({ where: { id: "__never__" } }),
		deleteActivities
			? prisma.activityLog.deleteMany({ where: { userId } })
			: prisma.activityLog.deleteMany({ where: { id: "__never__" } }),
		deleteNotifications
			? prisma.notification.deleteMany({ where: { userId } })
			: prisma.notification.deleteMany({ where: { id: "__never__" } }),
	]);

	return {
		deletedQuestions: questionsResult.count,
		deletedActivities: activitiesResult.count,
		deletedNotifications: notificationsResult.count,
	};
}

export async function revokeOtherSessions(userId: string, currentSessionId: string) {
	const result = await prisma.session.deleteMany({
		where: {
			userId,
			NOT: { id: currentSessionId },
		},
	});
	return result.count;
}

export async function deactivateAccount(userId: string) {
	await prisma.$transaction([
		prisma.user.update({
			where: { id: userId },
			data: { status: "suspended" },
		}),
		prisma.session.deleteMany({ where: { userId } }),
	]);
}

export async function permanentlyDeleteAccount(userId: string) {
	await prisma.$transaction([
		prisma.activityLog.deleteMany({ where: { userId } }),
		prisma.notification.deleteMany({ where: { userId } }),
		prisma.ragDocumentChunk.deleteMany({ where: { userId } }),
		prisma.analysis.deleteMany({ where: { analyzedById: userId } }),
		prisma.question.deleteMany({ where: { createdById: userId } }),
		prisma.userSettings.deleteMany({ where: { userId } }),
		prisma.session.deleteMany({ where: { userId } }),
		prisma.account.deleteMany({ where: { userId } }),
		prisma.user.delete({ where: { id: userId } }),
	]);
}

async function ensureSettings(userId: string) {
	return prisma.userSettings.upsert({
		where: { userId },
		update: {},
		create: {
			userId,
			timezone: PROFILE_DEFAULTS.timezone,
			language: PROFILE_DEFAULTS.language,
			defaultAiModel: AI_PREFERENCES_DEFAULTS.defaultAiModel,
			responseLength: AI_PREFERENCES_DEFAULTS.responseLength,
			temperature: AI_PREFERENCES_DEFAULTS.temperature,
			explanationLevel: AI_PREFERENCES_DEFAULTS.explanationLevel,
			difficultyStyle: AI_PREFERENCES_DEFAULTS.difficultyStyle,
			markdownOutput: AI_PREFERENCES_DEFAULTS.markdownOutput,
			codeOutput: AI_PREFERENCES_DEFAULTS.codeOutput,
			studyMode: AI_PREFERENCES_DEFAULTS.studyMode,
			autoSaveHistory: AI_PREFERENCES_DEFAULTS.autoSaveHistory,
			emailNotifications: NOTIFICATION_DEFAULTS.emailNotifications,
			pushNotifications: NOTIFICATION_DEFAULTS.pushNotifications,
			weeklyReports: NOTIFICATION_DEFAULTS.weeklyReports,
			analysisCompletion: NOTIFICATION_DEFAULTS.analysisCompletion,
			studyReminders: NOTIFICATION_DEFAULTS.studyReminders,
			leaderboardUpdates: NOTIFICATION_DEFAULTS.leaderboardUpdates,
			securityAlerts: NOTIFICATION_DEFAULTS.securityAlerts,
			productUpdates: NOTIFICATION_DEFAULTS.productUpdates,
			profileVisibility: PRIVACY_DEFAULTS.profileVisibility,
			analyticsEnabled: PRIVACY_DEFAULTS.analyticsEnabled,
			recommendationsEnabled: PRIVACY_DEFAULTS.recommendationsEnabled,
			activityVisibility: PRIVACY_DEFAULTS.activityVisibility,
			twoFactorEnabled: SECURITY_DEFAULTS.twoFactorEnabled,
		},
	});
}

function nullable(value: string) {
	return value.trim() ? value.trim() : null;
}
