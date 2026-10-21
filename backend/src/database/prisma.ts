import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
	const adapter = new PrismaPg({ connectionString: normalizePgConnectionString(env.DATABASE_URL) });
	return new PrismaClient({
		adapter,
		log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
	});
}

function normalizePgConnectionString(connectionString: string) {
	const url = new URL(connectionString);
	if (url.searchParams.get("sslmode") === "require") {
		url.searchParams.set("sslmode", "verify-full");
	}
	return url.toString();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}
