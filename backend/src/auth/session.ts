import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { env } from "../config/env";
import { prisma } from "../database";
import { AppError } from "../shared/utils/app-error";
import { auth } from ".";

export async function getRequestSession(req: Request) {
	return auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
}

export function getConfiguredAdminEmails() {
	return new Set(
		(env.ADMIN_EMAILS ?? "")
			.split(",")
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean),
	);
}

export async function hasAdminAccess(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { email: true, role: true, status: true },
	});

	if (user?.status !== "active") {
		return false;
	}

	return user.role === "admin" || getConfiguredAdminEmails().has(user.email.toLowerCase());
}

export async function requireRequestSession(req: Request) {
	const session = await getRequestSession(req);
	if (!session?.user?.id) {
		throw new AppError("Authentication required", 401);
	}
	const account = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { status: true },
	});
	if (account?.status !== "active") {
		throw new AppError("Account is not active", 403);
	}
	return session;
}

export async function requireAdminSession(req: Request) {
	const session = await requireRequestSession(req);
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { id: true, email: true, role: true, status: true },
	});
	const configuredAdmins = getConfiguredAdminEmails();

	if (user?.status !== "active") {
		throw new AppError("Account is not active", 403);
	}
	if (user.role !== "admin" && !configuredAdmins.has(user.email.toLowerCase())) {
		throw new AppError("Administrator access required", 403);
	}

	return { session, user };
}
