import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/utils/app-error";

interface Bucket {
	count: number;
	resetAt: number;
}

interface RateLimitOptions {
	keyPrefix: string;
	windowMs: number;
	max: number;
	message: string;
}

const buckets = new Map<string, Bucket>();

export function createRateLimiter(options: RateLimitOptions) {
	return (req: Request, res: Response, next: NextFunction) => {
		const now = Date.now();
		const key = `${options.keyPrefix}:${req.ip ?? "unknown"}`;
		const current = buckets.get(key);

		if (!current || current.resetAt <= now) {
			buckets.set(key, {
				count: 1,
				resetAt: now + options.windowMs,
			});
			res.setHeader("X-RateLimit-Limit", String(options.max));
			res.setHeader("X-RateLimit-Remaining", String(Math.max(0, options.max - 1)));
			return next();
		}

		if (current.count >= options.max) {
			const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1_000));
			res.setHeader("Retry-After", String(retryAfterSeconds));
			return next(new AppError(options.message, 429));
		}

		current.count += 1;
		res.setHeader("X-RateLimit-Limit", String(options.max));
		res.setHeader("X-RateLimit-Remaining", String(Math.max(0, options.max - current.count)));
		pruneExpiredBuckets(now);
		return next();
	};
}

function pruneExpiredBuckets(now: number) {
	if (buckets.size < 500) {
		return;
	}

	for (const [key, value] of buckets.entries()) {
		if (value.resetAt <= now) {
			buckets.delete(key);
		}
	}
}
