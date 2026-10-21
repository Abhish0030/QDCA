import assert from "node:assert/strict";
import test from "node:test";
import { env } from "../../../config/env";
import { classifyRequestSchema } from "../controllers/classification-controller";
import type { ModelClassification } from "./classification-service";
import {
	calibrateClassification,
	getModelRoute,
	parseClassificationResponse,
	toDifficultyKey,
} from "./classification-service";

const validClassification: ModelClassification = {
	difficulty: "Easy",
	confidence: 95,
	explanation: "Requires one direct arithmetic operation.",
	analysis: {
		bloomsLevel: "Apply",
		conceptComplexity: "Low",
		reasoningDepth: "Single-step",
		cognitiveLoad: "Low",
	},
	estimatedStudentLevel: "Primary school",
	estimatedTime: "Under 1 minute",
	skillsRequired: ["Addition"],
	keyConcepts: ["Arithmetic"],
};

test("parses a schema-compliant Ollama classification", () => {
	assert.deepEqual(
		parseClassificationResponse(JSON.stringify(validClassification)),
		validClassification,
	);
});

test("accepts a fenced JSON response and normalizes the persistence key", () => {
	const parsed = parseClassificationResponse(
		`\`\`\`json\n${JSON.stringify(validClassification)}\n\`\`\``,
	);
	assert.equal(parsed.difficulty, "Easy");
	assert.equal(toDifficultyKey("Very Easy"), "very_easy");
});

test("rejects malformed model output", () => {
	assert.throws(
		() => parseClassificationResponse('{"difficulty":"Impossible"}'),
		/invalid classification/i,
	);
});

test("rejects generic intensity labels in taxonomy-specific fields", () => {
	assert.throws(
		() =>
			parseClassificationResponse(
				JSON.stringify({
					...validClassification,
					analysis: { ...validClassification.analysis, bloomsLevel: "High" },
				}),
			),
		/invalid classification/i,
	);

	assert.throws(
		() =>
			parseClassificationResponse(
				JSON.stringify({
					...validClassification,
					analysis: { ...validClassification.analysis, reasoningDepth: "Significant" },
				}),
			),
		/invalid classification/i,
	);
});

test("calibrates unmistakable factual recall without changing higher-order questions", () => {
	const noisyRecall: ModelClassification = {
		...validClassification,
		difficulty: "Easy",
		analysis: {
			...validClassification.analysis,
			bloomsLevel: "Understand",
		},
		estimatedTime: "15-30 minutes",
	};
	const calibrated = calibrateClassification("What is the capital of France?", noisyRecall);

	assert.equal(calibrated.difficulty, "Very Easy");
	assert.equal(calibrated.analysis.bloomsLevel, "Remember");
	assert.equal(calibrated.estimatedTime, "Under 1 minute");
	assert.deepEqual(
		calibrateClassification("Explain how photosynthesis works.", validClassification),
		validClassification,
	);
});

test("validates and trims the classify route request", () => {
	const parsed = classifyRequestSchema.parse({ question: "  What is 2 + 2?  ", model: "llama" });
	assert.equal(parsed.question, "What is 2 + 2?");
	assert.equal(parsed.model, "llama");
	assert.equal(classifyRequestSchema.safeParse({ question: "x", model: "llama" }).success, false);
	for (const model of ["auto", "llama", "gemma", "nemotron", "groq"]) {
		assert.equal(
			classifyRequestSchema.safeParse({ question: "Valid question", model }).success,
			true,
		);
	}
	assert.equal(
		classifyRequestSchema.safeParse({ question: "Valid question", model: "claude" }).success,
		false,
	);
});

test("skips groq fallback when groq is not configured", () => {
	const originalGroqApiKey = env.GROQ_API_KEY;
	const originalOpenRouterGemmaApiKey = env.OPENROUTER_GEMMA_API_KEY;
	(env as { GROQ_API_KEY?: string }).GROQ_API_KEY = undefined;
	(env as { OPENROUTER_GEMMA_API_KEY?: string }).OPENROUTER_GEMMA_API_KEY = "test-gemma-key";

	try {
		const autoRoute = getModelRoute("auto");
		assert.deepEqual(
			autoRoute.map((target) => `${target.provider}:${target.model}`),
			[
				"openrouter:tencent/hy3:free",
				"ollama:llama3.2",
				"openrouter:google/gemma-4-26b-a4b-it:free",
			],
		);
	} finally {
		(env as { GROQ_API_KEY?: string }).GROQ_API_KEY = originalGroqApiKey;
		(env as { OPENROUTER_GEMMA_API_KEY?: string }).OPENROUTER_GEMMA_API_KEY =
			originalOpenRouterGemmaApiKey;
	}
});
