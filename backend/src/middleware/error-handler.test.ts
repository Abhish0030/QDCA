import assert from "node:assert/strict";
import test from "node:test";
import type { NextFunction, Request, Response } from "express";
import { errorHandler } from "./error-handler";

function createMockResponse() {
	const response = {
		statusCode: 200,
		body: null as unknown,
		status(code: number) {
			this.statusCode = code;
			return this;
		},
		json(payload: unknown) {
			this.body = payload;
			return this;
		},
	} as Response & {
		statusCode: number;
		body: unknown;
	};

	return response;
}

function createPrismaError(code: string, message = "Prisma failure") {
	const error = new Error(message) as Error & {
		name: string;
		code: string;
	};
	error.name = "PrismaClientKnownRequestError";
	error.code = code;
	return error;
}

test("maps Prisma unique constraint errors to 409", () => {
	const response = createMockResponse();

	errorHandler(
		createPrismaError("P2002", "Unique constraint failed on the fields: (`email`)"),
		{} as Request,
		response,
		(() => {}) as NextFunction,
	);

	assert.equal(response.statusCode, 409);
	assert.deepEqual(response.body, {
		success: false,
		message: "A record with this value already exists",
	});
});

test("maps Prisma record not found errors to 404", () => {
	const response = createMockResponse();

	errorHandler(
		createPrismaError("P2025", "Record to update not found."),
		{} as Request,
		response,
		(() => {}) as NextFunction,
	);

	assert.equal(response.statusCode, 404);
	assert.deepEqual(response.body, {
		success: false,
		message: "The requested record was not found",
	});
});

test("maps Prisma foreign key errors to 400", () => {
	const response = createMockResponse();

	errorHandler(
		createPrismaError("P2003", "Foreign key constraint failed"),
		{} as Request,
		response,
		(() => {}) as NextFunction,
	);

	assert.equal(response.statusCode, 400);
	assert.deepEqual(response.body, {
		success: false,
		message: "This action could not be completed because related data is invalid",
	});
});

test("falls back to generic 500 for unknown Prisma codes", () => {
	const response = createMockResponse();

	errorHandler(
		createPrismaError("P2999", "Unexpected Prisma error"),
		{} as Request,
		response,
		(() => {}) as NextFunction,
	);

	assert.equal(response.statusCode, 500);
	assert.deepEqual(response.body, {
		success: false,
		message: "Internal server error",
	});
});
