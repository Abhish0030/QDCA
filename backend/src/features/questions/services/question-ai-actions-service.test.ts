import assert from "node:assert/strict";
import test from "node:test";
import {
	isTimeSensitiveQuestion,
	normalizeAnswerResponse,
	parseAnswerResponse,
	parseDifficultyConversionResponse,
	selectAnswerRagContext,
} from "./question-ai-actions-service";

test("parses a schema-compliant generated answer response", () => {
	const parsed = parseAnswerResponse(
		JSON.stringify({
			correctAnswer: "Recursion solves a problem by reducing it into smaller instances of itself.",
			stepByStepExplanation: [
				"Identify the base case.",
				"Reduce the input into a smaller subproblem.",
				"Return or combine the recursive result.",
			],
			keyConcepts: ["Base case", "Recursive step", "Call stack"],
			finalSummary:
				"Recursion works by repeating the same logic on smaller versions of the problem.",
		}),
	);

	assert.equal(parsed.stepByStepExplanation.length, 3);
	assert.equal(parsed.keyConcepts[0], "Base case");
});

test("parses a schema-compliant difficulty conversion response", () => {
	const parsed = parseDifficultyConversionResponse(
		JSON.stringify({
			convertedQuestion: "Define recursion and give one base case example.",
			explanation: "The rewritten version reduces the question to direct explanation and recall.",
			analysis: {
				bloomsLevel: "Understand",
				conceptComplexity: "Low",
				reasoningDepth: "Single-step",
				cognitiveLoad: "Low",
			},
			estimatedStudentLevel: "High school",
			estimatedTime: "1-5 minutes",
			keyConcepts: ["Recursion", "Base case"],
		}),
	);

	assert.equal(parsed.analysis.bloomsLevel, "Understand");
	assert.equal(parsed.estimatedTime, "1-5 minutes");
});

test("rejects malformed answer and difficulty conversion payloads", () => {
	assert.throws(() => parseAnswerResponse('{"correctAnswer":""}'), /minimum/i);
	assert.throws(
		() =>
			parseDifficultyConversionResponse(
				'{"convertedQuestion":"Test","explanation":"x","analysis":{"bloomsLevel":"Hard"}}',
			),
		/invalid/i,
	);
});

test("normalizes duplicate answer steps and key concepts", () => {
	const parsed = normalizeAnswerResponse({
		correctAnswer: " Recursion repeats a function on smaller inputs. ",
		stepByStepExplanation: [
			" Identify the base case. ",
			"Identify the base case.",
			"Reduce the problem size.",
		],
		keyConcepts: [" Base case ", "Call stack", "Call stack"],
		finalSummary: " Recursion stops at a base case. ",
	});

	assert.deepEqual(parsed.stepByStepExplanation, [
		"Identify the base case.",
		"Reduce the problem size.",
	]);
	assert.deepEqual(parsed.keyConcepts, ["Base case", "Call stack"]);
	assert.equal(parsed.correctAnswer, "Recursion repeats a function on smaller inputs.");
	assert.equal(parsed.finalSummary, "Recursion stops at a base case.");
});

test("uses RAG context for answers only when similarity is strong enough", () => {
	assert.equal(
		selectAnswerRagContext({
			available: true,
			grounded: true,
			status: "grounded",
			chunkCount: 1,
			sources: ["doc.pdf"],
			topSimilarity: 0.8,
			context: "Relevant retrieved material",
		}),
		"Relevant retrieved material",
	);

	assert.equal(
		selectAnswerRagContext({
			available: true,
			grounded: true,
			status: "grounded",
			chunkCount: 1,
			sources: ["doc.pdf"],
			topSimilarity: 0.56,
			context: "Potentially unrelated material",
		}),
		"",
	);
});

test("detects time-sensitive real-world questions", () => {
	assert.equal(isTimeSensitiveQuestion("Who is CM of UP?"), true);
	assert.equal(isTimeSensitiveQuestion("Who is the current president of the company?"), true);
	assert.equal(isTimeSensitiveQuestion("Explain recursion with an example."), false);
});
