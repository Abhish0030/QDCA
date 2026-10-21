import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requireRequestSession } from "../../../auth/session";
import { classifyQuestion } from "../services/classification-service";

export const classifyRequestSchema = z.object({
	question: z.string().trim().min(3, "Question must contain at least 3 characters").max(5_000),
	model: z.enum(["auto", "llama", "gemma", "nemotron", "groq"]).default("auto"),
});

export async function classifyQuestionHandler(req: Request, res: Response, next: NextFunction) {
	try {
		const parsed = classifyRequestSchema.safeParse(req.body);

		if (!parsed.success) {
			return res.status(400).json({
				success: false,
				message: parsed.error.issues[0]?.message ?? "Invalid request body",
			});
		}

		const session = await requireRequestSession(req);
		const result = await classifyQuestion(parsed.data.question, session.user.id, parsed.data.model);
		return res.status(200).json(result);
	} catch (error) {
		return next(error);
	}
}
