import assert from "node:assert/strict";
import test from "node:test";
import { detectSubjectLocally, parseSubjectDetection } from "./subject-detection-service";

test("parses structured subject detection output", () => {
	const result = parseSubjectDetection(
		JSON.stringify({
			primarySubject: "Physics",
			relatedSubjects: ["Mathematics"],
			topics: ["Mechanics"],
			subtopics: ["Newton's Laws"],
			confidence: 94,
		}),
	);
	assert.equal(result.primarySubject, "Physics");
	assert.equal(result.confidence, 94);
});

test("detects common subjects locally when models are unavailable", () => {
	assert.equal(
		detectSubjectLocally("Explain graph implementation in C++").primarySubject,
		"Computer Science",
	);
	assert.equal(
		detectSubjectLocally("Calculate acceleration using Newton's law").primarySubject,
		"Mathematics",
	);
	assert.equal(detectSubjectLocally("What is photosynthesis in plants?").primarySubject, "Biology");
});
