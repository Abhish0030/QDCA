import { prisma } from "../../../database";

interface GeneratedReport {
	id: string;
	title: string;
	desc: string;
	type: "Daily" | "Monthly" | "Custom";
	date: string;
	data: unknown;
}

export async function getReports(userId: string) {
	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);
	const startOfMonth = new Date(Date.UTC(startOfDay.getUTCFullYear(), startOfDay.getUTCMonth(), 1));

	const [dailyQuestions, monthlyQuestions, totalQuestions, uploadRows] = await Promise.all([
		prisma.question.findMany({
			where: { createdById: userId, createdAt: { gte: startOfDay } },
			select: { id: true, title: true, difficulty: true, confidence: true, createdAt: true },
		}),
		prisma.question.count({ where: { createdById: userId, createdAt: { gte: startOfMonth } } }),
		prisma.question.count({ where: { createdById: userId } }),
		prisma.$queryRaw<Array<{ source: string; chunks: number; createdAt: Date }>>`
			SELECT COALESCE("source", 'Indexed document') AS "source",
				COUNT(*)::int AS "chunks", MIN("createdAt") AS "createdAt"
			FROM "rag_document_chunks"
			WHERE "userId" = ${userId}
			GROUP BY "source"
			ORDER BY MIN("createdAt") DESC
		`,
	]);

	const reports: GeneratedReport[] = uploadRows.map((upload, index) => ({
		id: `upload-${index}-${upload.createdAt.getTime()}`,
		title: upload.source,
		desc: `${upload.chunks} searchable RAG chunks indexed`,
		type: "Custom",
		date: upload.createdAt.toISOString(),
		data: { source: upload.source, indexedChunks: upload.chunks },
	}));

	if (dailyQuestions.length > 0) {
		reports.unshift({
			id: `daily-${startOfDay.toISOString().slice(0, 10)}`,
			title: "Daily classifications",
			desc: `${dailyQuestions.length} questions classified today`,
			type: "Daily",
			date: new Date().toISOString(),
			data: dailyQuestions,
		});
	}

	reports.push({
		id: `monthly-${startOfMonth.toISOString().slice(0, 7)}`,
		title: "Monthly learning summary",
		desc: `${monthlyQuestions} classifications this month; ${totalQuestions} total`,
		type: "Monthly",
		date: new Date().toISOString(),
		data: { monthlyQuestions, totalQuestions, indexedDocuments: uploadRows.length },
	});

	return reports;
}
