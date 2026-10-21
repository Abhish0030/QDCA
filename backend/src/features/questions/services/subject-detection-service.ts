import { z } from "zod";
import { env } from "../../../config/env";
import { generationOptions, requestOllama } from "./ollama-client";
import { isOllamaHealthyCached } from "./ollama-health";

const subjectDetectionSchema = z.object({
	primarySubject: z.string().trim().min(1).max(120),
	relatedSubjects: z.array(z.string().trim().min(1).max(120)).max(5),
	topics: z.array(z.string().trim().min(1).max(120)).max(8),
	subtopics: z.array(z.string().trim().min(1).max(120)).max(10),
	confidence: z.number().min(0).max(100),
});

export type SubjectDetection = z.infer<typeof subjectDetectionSchema>;

const PRIMARY_MODEL = env.OLLAMA_FAST_MODEL?.trim() || "gemma3:1b";
const FALLBACK_MODEL = env.OLLAMA_FALLBACK_MODEL?.trim() || "llama3.2";
const DETECTION_TIMEOUT_MS = 10_000;

const subjectDetectionJsonSchema = {
	type: "object",
	additionalProperties: false,
	required: ["primarySubject", "relatedSubjects", "topics", "subtopics", "confidence"],
	properties: {
		primarySubject: { type: "string" },
		relatedSubjects: { type: "array", items: { type: "string" } },
		topics: { type: "array", items: { type: "string" } },
		subtopics: { type: "array", items: { type: "string" } },
		confidence: { type: "number", minimum: 0, maximum: 100 },
	},
} as const;

export async function detectQuestionSubject(question: string): Promise<SubjectDetection> {
	if (!(await isOllamaHealthyCached())) {
		return detectSubjectLocally(question);
	}

	for (const model of [...new Set([PRIMARY_MODEL, FALLBACK_MODEL])]) {
		try {
			const payload = await requestOllama<{ response?: string }>(
				"/api/generate",
				{
					model,
					stream: false,
					format: subjectDetectionJsonSchema,
					options: generationOptions(0.1, 280, 42),
					prompt: buildDetectionPrompt(question),
				},
				DETECTION_TIMEOUT_MS,
			);
			return parseSubjectDetection(payload.response ?? "");
		} catch {
			// Try the configured fallback model before deterministic detection.
		}
	}

	return detectSubjectLocally(question);
}

export function parseSubjectDetection(response: string): SubjectDetection {
	const cleaned = response
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/, "");
	return subjectDetectionSchema.parse(JSON.parse(cleaned));
}

export function detectSubjectLocally(question: string): SubjectDetection {
	const normalized = question.toLowerCase();
	const match = SUBJECT_RULES.find((rule) =>
		rule.keywords.some((keyword) => normalized.includes(keyword)),
	);

	return {
		primarySubject: match?.subject ?? "General Knowledge",
		relatedSubjects: match?.related ? [...match.related] : [],
		topics: match?.topics ? [...match.topics] : ["General Reasoning"],
		subtopics: [],
		confidence: match ? 78 : 55,
	};
}

const SUBJECT_RULES = [
	{
		subject: "Computer Science",
		keywords: [
			"algorithm",
			"array",
			"binary",
			"code",
			"computer",
			"data structure",
			"graph",
			"java",
			"python",
			"c++",
			"program",
		],
		topics: ["Algorithms", "Data Structures", "Programming"],
		related: ["Mathematics", "Software Engineering"],
	},
	{
		subject: "Mathematics",
		keywords: [
			"algebra",
			"calculate",
			"derivative",
			"equation",
			"geometry",
			"integral",
			"matrix",
			"probability",
			"solve",
		],
		topics: ["Algebra", "Calculus", "Problem Solving"],
		related: ["Statistics", "Physics"],
	},
	{
		subject: "Physics",
		keywords: [
			"acceleration",
			"electric",
			"energy",
			"force",
			"gravity",
			"motion",
			"newton",
			"quantum",
			"velocity",
		],
		topics: ["Mechanics", "Energy", "Physical Laws"],
		related: ["Mathematics", "Engineering"],
	},
	{
		subject: "Biology",
		keywords: [
			"cell",
			"dna",
			"ecosystem",
			"evolution",
			"gene",
			"organism",
			"photosynthesis",
			"protein",
		],
		topics: ["Life Sciences", "Genetics", "Cell Biology"],
		related: ["Chemistry", "Medicine"],
	},
	{
		subject: "Chemistry",
		keywords: [
			"acid",
			"atom",
			"chemical",
			"compound",
			"element",
			"molecule",
			"reaction",
			"periodic",
		],
		topics: ["Chemical Reactions", "Atomic Structure", "Compounds"],
		related: ["Physics", "Biology"],
	},
	{
		subject: "Humanities",
		keywords: ["culture", "history", "literature", "philosophy", "politics", "society", "war"],
		topics: ["History", "Culture", "Critical Interpretation"],
		related: ["Social Science", "Literature"],
	},
] as const;

function buildDetectionPrompt(question: string) {
	return [
		"Identify the academic or professional subject of the question.",
		"Return only JSON matching the supplied schema.",
		"Use a clear primary subject, up to five related subjects, concise topics and subtopics, and confidence from 0 to 100.",
		`Question: ${question}`,
	].join("\n");
}
