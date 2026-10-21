import assert from "node:assert/strict";
import test from "node:test";
import { buildSystemPrompt, cleanReply, sanitizeChatbotMessages } from "./chatbot-service";

test("sanitizes chatbot messages by trimming, dropping blanks, and keeping the newest items", () => {
	const messages = [
		{ role: "user" as const, content: "   first   " },
		{ role: "assistant" as const, content: " second " },
		{ role: "user" as const, content: "   " },
		{ role: "assistant" as const, content: " third " },
		{ role: "user" as const, content: " fourth " },
		{ role: "assistant" as const, content: " fifth " },
		{ role: "user" as const, content: " sixth " },
		{ role: "assistant" as const, content: " seventh " },
	];

	assert.deepEqual(sanitizeChatbotMessages(messages), [
		{ role: "assistant", content: "second" },
		{ role: "assistant", content: "third" },
		{ role: "user", content: "fourth" },
		{ role: "assistant", content: "fifth" },
		{ role: "user", content: "sixth" },
		{ role: "assistant", content: "seventh" },
	]);
});

test("cleans assistant prefixes and excessive whitespace from ollama replies", () => {
	assert.equal(cleanReply("Assistant: Hello\n\n\nWorld"), "Hello\n\nWorld");
});

test("builds a safe system prompt when live context is unavailable", () => {
	const prompt = buildSystemPrompt(null);

	assert.match(prompt, /Live dashboard data is currently unavailable/);
	assert.doesNotMatch(prompt, /Total questions:/);
});
