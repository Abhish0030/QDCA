import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { requireRequestSession } from "../../../auth/session";
import { generateChatbotReply } from "../services/chatbot-service";

const chatbotMessageSchema = z.object({
	role: z.enum(["user", "assistant"]),
	content: z.string().trim().min(1),
});

const chatbotBodySchema = z.object({
	messages: z.array(chatbotMessageSchema).min(1).max(12),
});

export const sendChatbotMessageHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const parsedBody = chatbotBodySchema.safeParse(req.body);

		if (!parsedBody.success) {
			return res.status(400).json({
				success: false,
				message: parsedBody.error.issues[0]?.message ?? "Invalid request body",
			});
		}

		const session = await requireRequestSession(req);
		const result = await generateChatbotReply(parsedBody.data.messages, session.user.id);
		res.status(200).json({
			success: true,
			data: result,
		});
	} catch (error) {
		next(error);
	}
};
