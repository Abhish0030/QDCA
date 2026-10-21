import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/utils/app-error";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
	if (err instanceof AppError) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
		});
	}

	if (err instanceof ZodError) {
		return res.status(400).json({
			success: false,
			message: err.issues[0]?.message ?? "Invalid request",
		});
	}

	if (err.name === "MulterError") {
		const message =
			err.message === "File too large"
				? "The file exceeds the 20 MB upload limit"
				: err.message;
		return res.status(400).json({ success: false, message });
	}

	if (
		err.message === "Only PDF files are supported" ||
		err.message === "Supported files: PDF, PNG, JPG, JPEG, DOC, DOCX, and CSV."
	) {
		return res.status(400).json({ success: false, message: err.message });
	}

	const prismaErrorCode = getPrismaKnownRequestErrorCode(err);
	if (prismaErrorCode) {
		console.error("Prisma request error:", err);

		if (prismaErrorCode === "P2002") {
			return res.status(409).json({
				success: false,
				message: "A record with this value already exists",
			});
		}

		if (prismaErrorCode === "P2025") {
			return res.status(404).json({
				success: false,
				message: "The requested record was not found",
			});
		}

		if (prismaErrorCode === "P2003") {
			return res.status(400).json({
				success: false,
				message: "This action could not be completed because related data is invalid",
			});
		}
	}

	console.error("Unhandled error:", err);

	return res.status(500).json({
		success: false,
		message: "Internal server error",
	});
}

function getPrismaKnownRequestErrorCode(err: Error) {
	const candidate = err as Error & { code?: unknown; name?: unknown };
	if (candidate.name !== "PrismaClientKnownRequestError") {
		return null;
	}

	return typeof candidate.code === "string" ? candidate.code : null;
}
