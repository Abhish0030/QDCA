export function parseJsonFromModelResponse(response: string) {
	const cleaned = response
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/\s*```$/, "");

	try {
		return JSON.parse(cleaned);
	} catch {
		const extracted = extractFirstJsonObject(cleaned);
		if (!extracted) {
			throw new Error("No JSON object found in model response.");
		}

		return JSON.parse(extracted);
	}
}

function extractFirstJsonObject(input: string) {
	let depth = 0;
	let start = -1;
	let inString = false;
	let escaped = false;

	for (let index = 0; index < input.length; index += 1) {
		const char = input[index];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === "\\") {
			escaped = true;
			continue;
		}

		if (char === "\"") {
			inString = !inString;
			continue;
		}

		if (inString) {
			continue;
		}

		if (char === "{") {
			if (depth === 0) {
				start = index;
			}
			depth += 1;
			continue;
		}

		if (char === "}") {
			if (depth === 0) {
				continue;
			}

			depth -= 1;
			if (depth === 0 && start >= 0) {
				return input.slice(start, index + 1);
			}
		}
	}

	return null;
}
