import { Buffer } from "node:buffer";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
	FormatError,
	InvalidPDFException,
	type PageImages,
	PasswordException,
	PDFParse,
	type TableArray,
	UnknownErrorException,
	VerbosityLevel,
} from "pdf-parse";
import { createWorker, PSM } from "tesseract.js";
import mammoth from "mammoth";
import { env } from "../../../config/env";
import { AppError } from "../../../shared/utils/app-error";
import { requestGroqText } from "../../questions/services/groq-client";
import { getModelRoute } from "../../questions/services/classification-service";
import { requestOpenRouterText } from "../../questions/services/openrouter-client";
import { generationOptions, requestOllama } from "../../questions/services/ollama-client";

const PAGE_JOINER = "\n\n--- Page page_number of total_number ---\n\n";
const OCR_MIN_TEXT_LENGTH = 40;
const OCR_MIN_ALPHA_NUMERIC = 20;
const MAX_QUESTIONS = 500;

interface PdfExtractionMetadata {
	pageCount: number;
	tableCount: number;
	extractionMethod: "text" | "ocr" | "mixed" | "image_ocr" | "word" | "csv";
	ocrUsed: boolean;
	warnings: string[];
}

export interface PdfContent {
	text: string;
	questions: string[];
	metadata: PdfExtractionMetadata;
}

const QUESTION_EXTRACTION_TIMEOUT_MS = 45_000;
const questionExtractionSchema = {
	type: "object",
	additionalProperties: false,
	required: ["questions"],
	properties: {
		questions: {
			type: "array",
			items: { type: "string" },
			maxItems: MAX_QUESTIONS,
		},
	},
} as const;

export async function extractPdfQuestions(buffer: Buffer) {
	return (await extractPdfContent(buffer)).questions;
}

export async function extractPdfContent(buffer: Buffer): Promise<PdfContent> {
	if (!buffer.length) {
		throw new AppError("The uploaded PDF is empty", 400);
	}

	assertPdfSignature(buffer);

	const parser = new PDFParse({
		data: new Uint8Array(buffer),
		verbosity: env.NODE_ENV === "production" ? VerbosityLevel.ERRORS : VerbosityLevel.WARNINGS,
	});

	try {
		logPdfDebug("extract:start", { sizeBytes: buffer.length });

		const info = await parser.getInfo().catch((error) => {
			if (error instanceof PasswordException) {
				throw error;
			}
			return null;
		});
		const textResult = await parser.getText({
			lineEnforce: true,
			lineThreshold: 4.2,
			cellSeparator: " | ",
			cellThreshold: 6,
			pageJoiner: PAGE_JOINER,
			itemJoiner: "",
		});
		const tableResult = await parser.getTable().catch(() => null);

		const normalizedText = normalizeExtractedText(textResult.text);
		const tableText = mergeExtractedTables(tableResult?.mergedTables ?? []);
		const combinedText = joinTextSections(normalizedText, tableText);
		const warnings: string[] = [];
		let finalText = combinedText;
		let extractionMethod: PdfExtractionMetadata["extractionMethod"] = "text";
		let ocrUsed = false;

		if (!hasMeaningfulPdfText(combinedText)) {
			logPdfDebug("extract:ocr_fallback", {
				pageCount: info?.total ?? textResult.total,
				textLength: combinedText.length,
			});
			const ocrText = await extractTextWithOcr(parser);
			ocrUsed = true;
			extractionMethod = combinedText ? "mixed" : "ocr";
			finalText = joinTextSections(combinedText, ocrText);
			if (!hasMeaningfulPdfText(finalText)) {
				throw new AppError(
					"No readable text could be extracted from this PDF. It may be blank, image-only with unreadable scans, or corrupted.",
					422,
				);
			}
		}

		if (!normalizedText && ocrUsed) {
			warnings.push("Used OCR fallback because the PDF did not contain selectable text.");
		}

		const questions = extractQuestionLines(finalText);
		const recoveredQuestions = await recoverQuestionsWithLlm(finalText, questions).catch(
			(error) => {
				logPdfDebug("extract:llm_recovery_failed", {
					message: error instanceof Error ? error.message : String(error),
				});
				return questions;
			},
		);
		if (recoveredQuestions.length === 0) {
			warnings.push(
				"No question-like lines were detected, but the PDF text was extracted successfully.",
			);
		}

		logPdfDebug("extract:success", {
			pageCount: info?.total ?? textResult.total,
			textLength: finalText.length,
			questions: recoveredQuestions.length,
			tableCount: tableResult?.mergedTables.length ?? 0,
			extractionMethod,
		});

		return {
			text: finalText,
			questions: recoveredQuestions,
			metadata: {
				pageCount: info?.total ?? textResult.total,
				tableCount: tableResult?.mergedTables.length ?? 0,
				extractionMethod,
				ocrUsed,
				warnings,
			},
		};
	} catch (error) {
		throw toPdfAppError(error);
	} finally {
		await parser.destroy();
	}
}

export async function extractDocumentContent(
	buffer: Buffer,
	filename: string,
	mimeType = "",
): Promise<PdfContent> {
	const extension = path.extname(filename).toLowerCase();

	if (isPdfFile(extension, mimeType)) {
		return extractPdfContent(buffer);
	}

	if (isImageFile(extension, mimeType)) {
		return extractImageContent(buffer);
	}

	if (isCsvFile(extension, mimeType)) {
		return extractCsvContent(buffer);
	}

	if (isWordFile(extension, mimeType)) {
		return extractWordContent(buffer, extension);
	}

	throw new AppError("Supported files: PDF, PNG, JPG, JPEG, DOC, DOCX, and CSV.", 400);
}

export function extractQuestionLines(text: string) {
	const lines = text
		.replace(/\r/g, "")
		.split("\n")
		.map((line) => normalizeQuestionCandidate(line))
		.filter((line) => !isPageMarkerLine(line))
		.filter(Boolean);
	const numberedPattern = buildNumberedPattern(false);
	const subpartPattern = /^\(?(?:[a-d]|i{1,3}|iv|v|vi{0,3}|ix|x)\)?[\s.):-]+/i;
	const lineCandidates = lines
		.map((line) => ({
			original: line,
			candidate: stripQuestionPrefix(line, numberedPattern, subpartPattern),
		}))
		.filter(
			({ original, candidate }) =>
				Boolean(candidate) &&
				countDenseQuestionStarts(original) <= 1 &&
				(hasNumberedPrefix(original, numberedPattern) ||
					candidate.endsWith("?") ||
					looksLikeImperativeQuestion(candidate) ||
					looksLikeMathPrompt(candidate)),
		)
		.map(({ candidate }) => candidate)
		.filter(isValidQuestionCandidate);
	const blockCandidates = splitDenseNumberedQuestions(text)
		.map((line) =>
			stripQuestionPrefix(normalizeQuestionCandidate(line), numberedPattern, subpartPattern),
		)
		.filter(isValidQuestionCandidate);
	return [...new Set([...lineCandidates, ...blockCandidates])].slice(0, MAX_QUESTIONS);
}

function normalizeExtractedText(text: string) {
	return text
		.replace(/\r/g, "")
		.split("\0")
		.join("")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();
}

function joinTextSections(...parts: string[]) {
	return parts
		.map((part) => part.trim())
		.filter(Boolean)
		.join("\n\n");
}

function mergeExtractedTables(tables: TableArray[]) {
	const serialized = tables
		.flatMap((table, index) => {
			const rows = table
				.map((row) =>
					row
						.map((cell) => cell.replace(/\s+/g, " ").trim())
						.filter(Boolean)
						.join(" | "),
				)
				.filter(Boolean);
			return rows.length > 0 ? [`Table ${index + 1}:`, ...rows] : [];
		})
		.join("\n");

	return normalizeExtractedText(serialized);
}

function hasMeaningfulPdfText(text: string) {
	const alphanumericCount = (text.match(/[A-Za-z0-9]/g) ?? []).length;
	return text.trim().length >= OCR_MIN_TEXT_LENGTH && alphanumericCount >= OCR_MIN_ALPHA_NUMERIC;
}

async function extractTextWithOcr(parser: PDFParse) {
	const imageResult = await parser
		.getImage({
			imageDataUrl: false,
			imageBuffer: true,
			imageThreshold: 0,
		})
		.catch(() => null);
	const screenshotResult = await parser
		.getScreenshot({
			desiredWidth: 1800,
			imageDataUrl: false,
			imageBuffer: true,
		})
		.catch(() => null);
	const imageInputs = collectOcrInputs(imageResult?.pages ?? [], screenshotResult?.pages ?? []);

	if (imageInputs.length === 0) {
		throw new AppError("The PDF has no readable pages to analyze", 422);
	}

	const worker = await createWorker("eng", 1, {
		logger: (message) => {
			if (
				(env.NODE_ENV !== "production" || process.env.PDF_DEBUG === "true") &&
				message.progress >= 0
			) {
				logPdfDebug("ocr:progress", {
					status: message.status,
					progress: Math.round(message.progress * 100),
				});
			}
		},
	});

	try {
		await worker.setParameters({
			tessedit_pageseg_mode: PSM.AUTO,
			preserve_interword_spaces: "1",
		});

		const pages: string[] = [];
		for (const page of imageInputs) {
			const recognized = await worker.recognize(Buffer.from(page.data));
			const text = normalizeExtractedText(recognized.data.text);
			if (text) {
				pages.push(`--- Page ${page.pageNumber} ---\n${text}`);
			}
		}

		return pages.join("\n\n").trim();
	} finally {
		await worker.terminate();
	}
}

async function extractImageContent(buffer: Buffer): Promise<PdfContent> {
	if (!buffer.length) {
		throw new AppError("The uploaded image is empty", 400);
	}

	const text = await recognizeImageText(buffer);
	if (!hasMeaningfulPdfText(text)) {
		throw new AppError(
			"No readable text could be extracted from this image. Try a clearer scan or higher-resolution image.",
			422,
		);
	}

	const questions = await recoverQuestionsWithLlm(text, extractQuestionLines(text)).catch(() =>
		extractQuestionLines(text),
	);

	return {
		text,
		questions,
		metadata: {
			pageCount: 1,
			tableCount: 0,
			extractionMethod: "image_ocr",
			ocrUsed: true,
			warnings: ["Image OCR was used to extract text from this file."],
		},
	};
}

async function extractCsvContent(buffer: Buffer): Promise<PdfContent> {
	const text = normalizeExtractedText(buffer.toString("utf8"));
	if (!text) {
		throw new AppError("The uploaded CSV is empty", 400);
	}

	const rows = text
		.split("\n")
		.map((line) => line.split(",").map((cell) => cell.trim()).filter(Boolean).join(" | "))
		.filter(Boolean)
		.join("\n");
	const normalized = normalizeExtractedText(rows);
	const questions = await recoverQuestionsWithLlm(normalized, extractQuestionLines(normalized)).catch(
		() => extractQuestionLines(normalized),
	);

	return {
		text: normalized,
		questions,
		metadata: {
			pageCount: 1,
			tableCount: 0,
			extractionMethod: "csv",
			ocrUsed: false,
			warnings: [],
		},
	};
}

async function extractWordContent(buffer: Buffer, extension: string): Promise<PdfContent> {
	const warnings: string[] = [];
	let text = "";

	if (extension === ".docx") {
		const result = await mammoth.extractRawText({ buffer });
		text = normalizeExtractedText(result.value);
		if (Array.isArray(result.messages) && result.messages.length > 0) {
			warnings.push("Some DOCX formatting was simplified during extraction.");
		}
	} else {
		text = await extractLegacyWordText(buffer);
		warnings.push("Legacy DOC extraction may simplify formatting.");
	}

	if (!text) {
		throw new AppError("No readable text could be extracted from this Word document.", 422);
	}

	const questions = await recoverQuestionsWithLlm(text, extractQuestionLines(text)).catch(() =>
		extractQuestionLines(text),
	);

	return {
		text,
		questions,
		metadata: {
			pageCount: 1,
			tableCount: 0,
			extractionMethod: "word",
			ocrUsed: false,
			warnings,
		},
	};
}

async function extractLegacyWordText(buffer: Buffer) {
	const filePath = path.join(tmpdir(), `qdca-${Date.now()}-${Math.random().toString(36).slice(2)}.doc`);
	try {
		await fs.writeFile(filePath, buffer);
		const { default: WordExtractor } = await import("word-extractor");
		const extractor = new (WordExtractor as unknown as new () => {
			extract: (value: string) => Promise<{ getBody: () => string }>;
		})();
		const document = await extractor.extract(filePath);
		return normalizeExtractedText(document.getBody?.() ?? "");
	} finally {
		await fs.unlink(filePath).catch(() => undefined);
	}
}

async function recognizeImageText(buffer: Buffer) {
	const worker = await createWorker("eng", 1);
	try {
		await worker.setParameters({
			tessedit_pageseg_mode: PSM.AUTO,
			preserve_interword_spaces: "1",
		});
		const recognized = await worker.recognize(buffer);
		return normalizeExtractedText(recognized.data.text);
	} finally {
		await worker.terminate();
	}
}

function assertPdfSignature(buffer: Buffer) {
	const header = buffer.subarray(0, Math.min(buffer.length, 8)).toString("latin1");
	if (!header.startsWith("%PDF-")) {
		throw new AppError("The uploaded file is not a valid PDF document", 400);
	}
}

function isPdfFile(extension: string, mimeType: string) {
	return extension === ".pdf" || mimeType === "application/pdf";
}

function isImageFile(extension: string, mimeType: string) {
	return (
		[".png", ".jpg", ".jpeg"].includes(extension) ||
		["image/png", "image/jpeg", "image/jpg"].includes(mimeType)
	);
}

function isCsvFile(extension: string, mimeType: string) {
	return extension === ".csv" || mimeType === "text/csv" || mimeType === "application/csv";
}

function isWordFile(extension: string, mimeType: string) {
	return (
		[".doc", ".docx"].includes(extension) ||
		[
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		].includes(mimeType)
	);
}

function normalizeQuestionCandidate(line: string) {
	return line
		.replace(/\u00a0/g, " ")
		.replace(/[•●▪◦]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function stripQuestionPrefix(line: string, numberedPattern: RegExp, subpartPattern: RegExp) {
	const embeddedNumberMatch = line.match(
		/(?:^|(?:[A-Z][\s|:]+)|(?:\|\s*)|(?:-\s*))((?:question\s*|ques(?:tion)?\s*|q\s*)?(?:no\.?\s*)?\d{1,3}(?:\s*[A-Za-z])?[\s.):-]+.+)$/i,
	);
	const candidate = (embeddedNumberMatch?.[1] ?? line)
		.replace(numberedPattern, "")
		.replace(subpartPattern, "")
		.trim();
	return candidate;
}

function hasNumberedPrefix(line: string, numberedPattern: RegExp) {
	return (
		numberedPattern.test(line) ||
		/(?:^|[\s|:;-])(?:question\s*|ques(?:tion)?\s*|q\s*)?(?:no\.?\s*)?\d{1,3}(?:\s*[A-Za-z])?[\s.):-]+/i.test(
			line,
		)
	);
}

function looksLikeImperativeQuestion(line: string) {
	return /^(?:explain|define|describe|discuss|compare|contrast|calculate|solve|evaluate|derive|prove|find|show|state|identify|justify|determine|write|list|implement|create|develop|build|design|print|display|convert|check|sort|search|construct|generate|return|accept|input)\b/i.test(
		line,
	);
}

function looksLikeMathPrompt(line: string) {
	return /^(?:if|let|given|using)\b/i.test(line) && /[=+\-*/^()[\]{}]/.test(line);
}

function isValidQuestionCandidate(line: string) {
	if (line.length < 5 || line.length > 1_000) return false;
	if (/^(?:page|section|instructions?|marks?|total|time|note)\b/i.test(line)) return false;
	if (isPageMarkerLine(line)) return false;
	const alphaNumericCount = (line.match(/[A-Za-z0-9]/g) ?? []).length;
	return alphaNumericCount >= 3;
}

function isPageMarkerLine(line: string) {
	return (
		/^---\s*page\s+\d+\s+of\s+\d+\s*---$/i.test(line) ||
		/^page\s+\d+\s+of\s+\d+$/i.test(line) ||
		/^of\s+\d+\s*---$/i.test(line)
	);
}

function toPdfAppError(error: unknown) {
	if (error instanceof AppError) {
		return error;
	}

	if (error instanceof PasswordException) {
		return new AppError(
			"This PDF is password-protected or encrypted and cannot be analyzed until it is unlocked.",
			422,
		);
	}

	if (error instanceof InvalidPDFException || error instanceof FormatError) {
		return new AppError("This PDF is invalid, corrupted, or uses an unsupported structure.", 400);
	}

	if (error instanceof UnknownErrorException) {
		return new AppError(
			error.message ||
				"The PDF could not be parsed. Please try another file or export the PDF again.",
			422,
		);
	}

	return new AppError(
		error instanceof Error ? error.message : "Unexpected PDF analysis failure",
		500,
	);
}

function logPdfDebug(event: string, data: Record<string, unknown>) {
	if (env.NODE_ENV === "production" && process.env.PDF_DEBUG !== "true") {
		return;
	}

	console.info(`[pdf] ${event}`, data);
}

function collectOcrInputs(
	imagePages: Array<PageImages>,
	screenshotPages: Array<{ data: Uint8Array; pageNumber: number }>,
) {
	const embeddedImages = imagePages.flatMap((page) =>
		(page.images ?? []).map((image, index) => ({
			data: image.data,
			pageNumber: page.pageNumber ?? index + 1,
		})),
	);

	if (embeddedImages.length > 0) {
		return embeddedImages.filter((image) => image.data && image.data.length > 0);
	}

	return screenshotPages.filter((page) => page.data && page.data.length > 0);
}

function splitDenseNumberedQuestions(text: string) {
	const segments: string[] = [];
	for (const line of text.replace(/\r/g, "").split("\n")) {
		const normalized = normalizeQuestionCandidate(line);
		if (!normalized || countDenseQuestionStarts(normalized) < 2) {
			continue;
		}

		const denseNumberPrefix = buildNumberedPattern(true).source.replace(/^\^/, "");
		const pattern = new RegExp(
			`(?:^|[\\s|:;-])(${denseNumberPrefix}.*?)(?=(?:[\\s|:;-]${denseNumberPrefix})|$)`,
			"gi",
		);

		for (const match of normalized.matchAll(pattern)) {
			const candidate = match[1]?.trim();
			if (candidate) {
				segments.push(candidate);
			}
		}
	}
	return segments;
}

function buildNumberedPattern(dense = false) {
	const suffix = dense ? "(?:\\s*[.):-]\\s+|\\s+(?=[A-Z]))" : "[\\s.):-]+";
	return new RegExp(
		`^(?:question\\s*|ques(?:tion)?\\s*|q\\s*)?(?:no\\.?\\s*)?\\d{1,3}(?:\\s*[A-Za-z])?${suffix}`,
		"i",
	);
}

function countDenseQuestionStarts(text: string) {
	const denseNumberPrefix = buildNumberedPattern(true).source.replace(/^\^/, "");
	const matches = text.match(new RegExp(`(?:^|[\\s|:;-])${denseNumberPrefix}`, "gi"));
	return matches?.length ?? 0;
}

async function recoverQuestionsWithLlm(text: string, extractedQuestions: string[]) {
	const normalized = [
		...new Set(extractedQuestions.map((question) => question.trim()).filter(Boolean)),
	];
	if (normalized.length >= 2 || text.length < 40) {
		return normalized;
	}

	const models = getModelRoute("auto");
	let lastError: unknown;
	for (const [index, target] of models.entries()) {
		try {
			const prompt = buildQuestionRecoveryPrompt(text, normalized);
			const responseText =
				target.provider === "groq"
					? (
							await requestGroqText({
								model: target.model,
								userPrompt: prompt,
								temperature: 1,
								maxCompletionTokens: 2048,
								topP: 1,
								reasoningEffort: "medium",
								timeoutMs: QUESTION_EXTRACTION_TIMEOUT_MS,
							})
						).text
					: target.provider === "openrouter"
						? (
								await requestOpenRouterText({
									model: target.model,
									userPrompt: prompt,
									temperature: 0,
									maxTokens: 700,
									timeoutMs: QUESTION_EXTRACTION_TIMEOUT_MS,
								})
							).text
						: (
								await requestOllama<{ response?: string }>(
									"/api/generate",
									{
										model: target.model,
										stream: false,
										format: questionExtractionSchema,
										options: generationOptions(0, 400, 42),
										prompt,
									},
									QUESTION_EXTRACTION_TIMEOUT_MS,
								)
							).response ?? "";
			const recovered = parseRecoveredQuestions(responseText);
			if (recovered.length > normalized.length) {
				logPdfDebug("extract:llm_recovery_success", {
					model: target.model,
					recoveredQuestions: recovered.length,
					fallback: index > 0,
				});
			}
			return recovered.length > 0 ? recovered : normalized;
		} catch (error) {
			lastError = error;
		}
	}

	if (lastError) {
		throw lastError;
	}

	return normalized;
}

function parseRecoveredQuestions(response: string) {
	const cleaned = response
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/, "");

	const parsed = JSON.parse(cleaned) as { questions?: unknown };
	const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
	return [
		...new Set(
			questions
				.map((question) => normalizeQuestionCandidate(String(question)))
				.filter(isValidQuestionCandidate),
		),
	].slice(0, MAX_QUESTIONS);
}

function buildQuestionRecoveryPrompt(text: string, existingQuestions: string[]) {
	return [
		"Extract every actual question prompt from the PDF text and return only valid JSON matching the schema.",
		"Keep each question as a clean standalone sentence or prompt.",
		"Ignore page markers, instructions, headers, footers, marks, and separators like ---.",
		"If the text contains numbered programming tasks, return each task separately.",
		"Do not summarize. Do not classify. Only extract questions.",
		existingQuestions.length > 0
			? `Already extracted questions: ${existingQuestions.join(" | ")}`
			: "No reliable questions were extracted yet.",
		`PDF text:\n${text}`,
	].join("\n");
}
