import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requireRequestSession } from "../../../auth/session";
import {
	convertQuestionDifficulty,
	generateAnswerForQuestion,
	streamAnswerForQuestion,
} from "../services/question-ai-actions-service";

const modelSchema = z.enum(["auto", "llama", "gemma", "nemotron", "groq"]).default("auto");

const generateAnswerSchema = z.object({
	question: z.string().trim().min(3).max(5_000),
	model: modelSchema.optional(),
});

const changeDifficultySchema = z.object({
	question: z.string().trim().min(3).max(5_000),
	originalDifficulty: z.enum(["Very Easy", "Easy", "Medium", "Hard", "Expert"]),
	newDifficulty: z.enum(["Very Easy", "Easy", "Medium", "Hard", "Expert"]),
	model: modelSchema.optional(),
});

export async function generateAnswerHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = generateAnswerSchema.safeParse(req.body);

		if (!parsed.success) {
			return res.status(400).json({
				success: false,
				message: parsed.error.issues[0]?.message ?? "Invalid answer generation request",
			});
		}

		const data = await generateAnswerForQuestion(
			parsed.data.question,
			session.user.id,
			parsed.data.model ?? "auto",
		);

		return res.status(200).json({
			success: true,
			data,
		});
	} catch (error) {
		return next(error);
	}
}

export async function streamAnswerHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = generateAnswerSchema.safeParse(req.body);

		if (!parsed.success) {
			return res.status(400).json({
				success: false,
				message: parsed.error.issues[0]?.message ?? "Invalid answer generation request",
			});
		}

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache, no-transform");
		res.setHeader("Connection", "keep-alive");
		res.flushHeaders();

		const sendEvent = (event: unknown) => {
			res.write(`data: ${JSON.stringify(event)}\n\n`);
		};

		await streamAnswerForQuestion(
			parsed.data.question,
			session.user.id,
			parsed.data.model ?? "auto",
			sendEvent,
		);

		res.write("event: done\ndata: {}\n\n");
		return res.end();
	} catch (error) {
		if (!res.headersSent) {
			return next(error);
		}

		res.write(
			`event: error\ndata: ${JSON.stringify({
				message: error instanceof Error ? error.message : "Answer stream failed",
			})}\n\n`,
		);
		return res.end();
	}
}

export async function changeDifficultyHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const session = await requireRequestSession(req);
		const parsed = changeDifficultySchema.safeParse(req.body);

		if (!parsed.success) {
			return res.status(400).json({
				success: false,
				message: parsed.error.issues[0]?.message ?? "Invalid difficulty change request",
			});
		}

		if (parsed.data.originalDifficulty === parsed.data.newDifficulty) {
			return res.status(400).json({
				success: false,
				message: "Choose a different target difficulty",
			});
		}

		const data = await convertQuestionDifficulty({
			question: parsed.data.question,
			originalDifficulty: parsed.data.originalDifficulty,
			newDifficulty: parsed.data.newDifficulty,
			userId: session.user.id,
			model: parsed.data.model ?? "auto",
		});

		return res.status(200).json({
			success: true,
			data,
		});
	} catch (error) {
		return next(error);
	}
}
