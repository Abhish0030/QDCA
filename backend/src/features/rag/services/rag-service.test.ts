import assert from "node:assert/strict";
import test from "node:test";
import { chunkDocument } from "./rag-service";

test("splits document text into overlapping retrieval chunks", () => {
	const text = Array.from(
		{ length: 80 },
		(_, index) => `Sentence ${index + 1} describes an examinable concept in enough detail.`,
	).join(" ");
	const chunks = chunkDocument(text, 300, 50);

	assert.ok(chunks.length > 1);
	assert.ok(chunks.every((chunk) => chunk.length >= 40 && chunk.length <= 301));
	assert.match(chunks.join(" "), /Sentence 1/);
	assert.match(chunks.join(" "), /Sentence 80/);
});

test("does not create chunks for blank documents", () => {
	assert.deepEqual(chunkDocument(" \n\t "), []);
});
