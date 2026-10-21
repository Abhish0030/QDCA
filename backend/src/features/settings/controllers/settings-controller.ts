import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { auth } from "../../../auth";
import { requireRequestSession } from "../../../auth/session";
import { AppError } from "../../../shared/utils/app-error";
import { createNotification } from "../../notifications/services/notification-service";
import {
	clearUserData,
	deactivateAccount,
	exportUserData,
	getSettingsView,
	permanentlyDeleteAccount,
	recordPasswordChange,
	removeAvatar,
	revokeOtherSessions,
	storeAvatar,
	updateAiPreferences,
	updateNotificationSettings,
	updatePrivacySettings,
	updateProfileSettings,
	updateRecoverySettings,
} from "../services/settings-service";

const profileSchema = z.object({
	name: z.string().trim().min(2).max(80),
	username: z
		.string()
		.trim()
		.min(3)
		.max(32)
		.regex(/^[a-zA-Z0-9._-]+$/),
	email: z.string().trim().email().max(160),
	phone: z.string().trim().max(32),
	university: z.string().trim().max(120),
	department: z.string().trim().max(120),
	degree: z.string().trim().max(120),
	semester: z.string().trim().max(80),
	bio: z.string().trim().max(320),
	country: z.string().trim().max(80),
	timezone: z.string().trim().max(80),
	language: z.string().trim().min(2).max(40),
});

const aiPreferencesSchema = z.object({
	defaultAiModel: z.string().trim().min(1).max(40),
	responseLength: z.string().trim().min(1).max(24),
	temperature: z.number().min(0).max(1),
	explanationLevel: z.string().trim().min(1).max(40),
	difficultyStyle: z.string().trim().min(1).max(40),
	markdownOutput: z.boolean(),
	codeOutput: z.boolean(),
	studyMode: z.string().trim().min(1).max(40),
	language: z.string().trim().min(2).max(40),
	autoSaveHistory: z.boolean(),
});

const notificationsSchema = z.object({
	email: z.boolean(),
	push: z.boolean(),
	weeklyReports: z.boolean(),
	analysisCompletion: z.boolean(),
	studyReminders: z.boolean(),
	leaderboardUpdates: z.boolean(),
	securityAlerts: z.boolean(),
	productUpdates: z.boolean(),
});

const privacySchema = z.object({
	profileVisibility: z.enum(["public", "private", "contacts"]),
	analytics: z.boolean(),
	recommendations: z.boolean(),
	activityVisibility: z.enum(["public", "private", "contacts"]),
});

const recoverySchema = z.object({
	recoveryEmail: z.string().trim().max(160),
	recoveryPhone: z.string().trim().max(32),
});

const clearDataSchema = z.object({
	target: z.enum(["chat", "analysis", "history", "all"]),
});

const passwordSchema = z.object({
	currentPassword: z.string().min(8).max(128),
	newPassword: z.string().min(8).max(128),
	revokeOtherSessions: z.boolean().optional().default(true),
});

const deleteAccountSchema = z.object({
	password: z.string().min(8).max(128),
	confirmation: z.literal("DELETE"),
});

export async function getSettingsHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		return res.json({
			success: true,
			data: await getSettingsView(session.user.id, session.session.id),
		});
	} catch (error) {
		return next(error);
	}
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = profileSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid profile details." });
		}
		const data = await updateProfileSettings(session.user.id, parsed.data);
		await createNotification({
			userId: session.user.id,
			type: "profile_updated",
			title: "Profile updated",
			message: "Your personal details were updated successfully.",
			entityType: "settings",
		});

		return res.json({
			success: true,
			data,
		});
	} catch (error) {
		return next(error);
	}
}

export async function uploadAvatarHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const file = req.file;

		if (!file) {
			return res.status(400).json({ success: false, message: "An image file is required." });
		}

		if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
			return res
				.status(400)
				.json({ success: false, message: "Only JPG, PNG, and WebP are supported." });
		}

		const image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
		const storedImage = await storeAvatar(session.user.id, image);
		await createNotification({
			userId: session.user.id,
			type: "profile_updated",
			title: "Profile photo updated",
			message: "Your avatar was updated successfully.",
			entityType: "settings",
		});

		return res.json({
			success: true,
			data: { image: storedImage },
		});
	} catch (error) {
		return next(error);
	}
}

export async function deleteAvatarHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		await removeAvatar(session.user.id);
		await createNotification({
			userId: session.user.id,
			type: "profile_updated",
			title: "Profile photo removed",
			message: "Your avatar was removed from your account.",
			entityType: "settings",
		});
		return res.json({ success: true });
	} catch (error) {
		return next(error);
	}
}

export async function updateAiPreferencesHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = aiPreferencesSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid AI preferences." });
		}
		const data = await updateAiPreferences(session.user.id, parsed.data);
		await createNotification({
			userId: session.user.id,
			type: "settings_updated",
			title: "AI preferences updated",
			message: `Default model set to ${parsed.data.defaultAiModel}.`,
			entityType: "settings",
		});
		return res.json({ success: true, data });
	} catch (error) {
		return next(error);
	}
}

export async function updateNotificationsHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = notificationsSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid notification settings." });
		}
		const data = await updateNotificationSettings(session.user.id, parsed.data);
		await createNotification({
			userId: session.user.id,
			type: "settings_updated",
			title: "Notification settings updated",
			message: "Your notification preferences were saved.",
			entityType: "settings",
		});
		return res.json({ success: true, data });
	} catch (error) {
		return next(error);
	}
}

export async function updatePrivacyHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = privacySchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid privacy settings." });
		}
		const data = await updatePrivacySettings(session.user.id, parsed.data);
		await createNotification({
			userId: session.user.id,
			type: "settings_updated",
			title: "Privacy settings updated",
			message: `Profile visibility is now ${parsed.data.profileVisibility}.`,
			entityType: "settings",
		});
		return res.json({ success: true, data });
	} catch (error) {
		return next(error);
	}
}

export async function exportDataHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const data = await exportUserData(session.user.id);
		await createNotification({
			userId: session.user.id,
			type: "settings_updated",
			title: "Account data exported",
			message: "Your account export was generated successfully.",
			entityType: "settings",
		});
		return res.json({ success: true, data });
	} catch (error) {
		return next(error);
	}
}

export async function clearDataHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = clearDataSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid clear-data request." });
		}
		const data = await clearUserData(session.user.id, parsed.data.target);
		await createNotification({
			userId: session.user.id,
			type: "settings_updated",
			title: "Account data cleared",
			message: `Your ${parsed.data.target} data was cleared successfully.`,
			entityType: "settings",
		});
		return res.json({ success: true, data });
	} catch (error) {
		return next(error);
	}
}

export async function changePasswordHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = passwordSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid password details." });
		}

		await auth.api.changePassword({
			headers: fromNodeHeaders(req.headers),
			body: parsed.data,
		});
		await recordPasswordChange(session.user.id);
		await createNotification({
			userId: session.user.id,
			type: "security_alert",
			title: "Password changed",
			message: "Your password was updated successfully.",
			entityType: "security",
		});

		return res.json({ success: true });
	} catch (error) {
		return next(error);
	}
}

export async function getSessionsHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		return res.json({
			success: true,
			data: (await getSettingsView(session.user.id, session.session.id)).security.recentSessions,
		});
	} catch (error) {
		return next(error);
	}
}

export async function logoutOtherSessionsHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const revoked = await revokeOtherSessions(session.user.id, session.session.id);
		await createNotification({
			userId: session.user.id,
			type: "security_alert",
			title: "Other devices signed out",
			message: `${revoked} other session${revoked === 1 ? "" : "s"} were signed out.`,
			entityType: "security",
		});
		return res.json({
			success: true,
			data: {
				revoked,
			},
		});
	} catch (error) {
		return next(error);
	}
}

export async function updateRecoveryHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = recoverySchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid recovery options." });
		}
		const data = await updateRecoverySettings(session.user.id, parsed.data);
		await createNotification({
			userId: session.user.id,
			type: "security_alert",
			title: "Recovery options updated",
			message: "Your recovery details were saved successfully.",
			entityType: "security",
		});
		return res.json({ success: true, data });
	} catch (error) {
		return next(error);
	}
}

export async function deactivateAccountHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		await createNotification({
			userId: session.user.id,
			type: "security_alert",
			title: "Account deactivated",
			message: "Your account has been deactivated and signed out.",
			entityType: "account",
		});
		await deactivateAccount(session.user.id);
		return res.json({ success: true });
	} catch (error) {
		return next(error);
	}
}

export async function deleteAccountHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = deleteAccountSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ success: false, message: "Invalid account deletion request." });
		}

		const verification = await auth.api.verifyPassword({
			headers: fromNodeHeaders(req.headers),
			body: { password: parsed.data.password },
		});

		if (!verification?.status) {
			throw new AppError("Your password is incorrect.", 401);
		}

		await permanentlyDeleteAccount(session.user.id);
		return res.json({ success: true });
	} catch (error) {
		return next(error);
	}
}
