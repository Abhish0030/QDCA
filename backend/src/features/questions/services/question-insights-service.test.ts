import assert from "node:assert/strict";
import test from "node:test";
import { calculateSimilarity } from "./question-insights-service";

test("scores related questions above unrelated questions", () => {
	const related = calculateSimilarity(
		"How are graphs implemented in C++?",
		"Explain graph implementation using C++ adjacency lists",
	);
	const unrelated = calculateSimilarity(
		"How are graphs implemented in C++?",
		"Describe photosynthesis in flowering plants",
	);
	assert.ok(related > unrelated);
	assert.ok(related > 0.3);
});

test("returns zero for empty comparable terms", () => {
	assert.equal(calculateSimilarity("what is the", "a and the"), 0);
});

test("matches compound data-structure terms without exact spacing", () => {
	const related = calculateSimilarity(
		"what is Linklist",
		"Explain linked list operations and implementation",
	);
	assert.ok(related > 0.45);
});
