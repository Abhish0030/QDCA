import assert from "node:assert/strict";
import test from "node:test";
import { extractQuestionLines } from "./pdf-service";

test("extracts numbered and question-mark PDF lines", () => {
	const questions = extractQuestionLines(`Exam Paper
1. What is photosynthesis?
Q2) Explain Newton's second law.
Instructions: answer all questions
How does gravity affect an orbit?`);

	assert.deepEqual(questions, [
		"What is photosynthesis?",
		"Explain Newton's second law.",
		"How does gravity affect an orbit?",
	]);
});

test("deduplicates repeated questions", () => {
	assert.deepEqual(extractQuestionLines("1. What is 2 + 2?\n1. What is 2 + 2?"), [
		"What is 2 + 2?",
	]);
});

test("extracts numbered questions embedded inside table-like rows", () => {
	assert.deepEqual(
		extractQuestionLines(`Section Question
A 4. Solve for x: 2x + 3 = 7
B 5. Compare mitosis and meiosis
C 6. Write a short note on democracy`),
		["Solve for x: 2x + 3 = 7", "Compare mitosis and meiosis", "Write a short note on democracy"],
	);
});

test("extracts dense numbered programming prompts from a single paragraph", () => {
	assert.deepEqual(
		extractQuestionLines(
			`Programming Set 1. Write a program to print Hello World 2. Implement binary search in C 3. Create a function to reverse a string`,
		),
		[
			"Write a program to print Hello World",
			"Implement binary search in C",
			"Create a function to reverse a string",
		],
	);
});
