const functionRateLimits = {};

/**
 * @description Bind a function to a rate limiter
 * @param  {...any} args
 * @returns {Promise<import("./http").RateLimitedResponse>}
 */
export async function rateLimitedFunction(name, fn, ...args) {
	let rateLimit = functionRateLimits[name];
	if (!rateLimit) {
		rateLimit = {
			remaining: 1,
			resetAfter: 0,
			lastCall: Date.now(),
		};
		functionRateLimits[name] = rateLimit;
	}

	if (rateLimit.remaining <= 0) {
		const timeSinceLastCall = Date.now() - rateLimit.lastCall;
		const timeToWait = rateLimit.resetAfter * 1000 - timeSinceLastCall;
		if (timeToWait > 0) {
			console.log(`Rate limit reached for ${name}. Waiting for ${timeToWait}ms`);
			await new Promise(fin => setTimeout(fin, timeToWait));
		}
	}

	const response = await fn(...args);
	if (response.remaining)
		rateLimit.remaining = response.remaining;

	if (response.resetAfter)
		rateLimit.resetAfter = response.resetAfter;

	rateLimit.lastCall = Date.now();
	return response;
}
