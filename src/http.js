const DISCORD_ENDPOINT = "https://discord.com/api/v10";
let DISCORD_TOKEN = '';

/** @type {RateLimitedRequest[]} */
const requestQueue = [];
let isProcessing = false;

/**
 * @typedef {Response & {
 * 		remaining?: number,
 	* 	resetAfter?: number,
 * 	}} RateLimitedResponse
 */

/**
 * @typedef {Request & {
 * 	resolve: (response: RateLimitedResponse) => void,
 * }} RateLimitedRequest
 */

/**
 * @param {RateLimitedRequest} request
 * @returns {Promise<RateLimitedResponse | null>}
 */
async function sendRequest(request) {
	try {
		const response = await fetch(request);

		const remaining = response.headers.get('X-RateLimit-Remaining');
		if (remaining)
			response.remaining = parseInt(remaining);

		const resetAfter = response.headers.get('X-RateLimit-Reset-After');
		if (resetAfter)
			response.resetAfter = parseFloat(resetAfter);

		console.log(`Response (status ${response?.status}) received with remaining ${remaining ?? -1} and resetAfter ${resetAfter ?? -1}`);
		return response;
	} catch (err) {
		console.error("Error fetching data", err);
		return null;
	}
}

/**
 * @param {string} method
 * @param {string} path
 * @param {any} body
 * @returns {Promise<RateLimitedResponse>}
 */
async function makeRequest(method, path, body) {
	console.log(`Making ${method} request to ${path} with body ${JSON.stringify(body)}`);
	const request = new Request(`${DISCORD_ENDPOINT}${path}`, {
		method: method,
		headers: {
			'Content-Type': 'application/json;charset=UTF-8',
			'Authorization': `Bot ${DISCORD_TOKEN}`
		},
		body: JSON.stringify(body)
	});

	return new Promise((resolve, _) => {
		request.resolve = resolve;
		requestQueue.push(request);
		process();
	});
}

async function process() {
	if (isProcessing)
		return;

	isProcessing = true;
	while (requestQueue.length > 0) {
		const queued = requestQueue.shift();
		if (!queued)
			continue;

		const response = await sendRequest(queued);
		if (!response)
			continue;

		// Global rate limit reached
		if (response.status === 429) {
			const globalLimitReached = response.headers.get('X-RateLimit-Global');
			if (globalLimitReached) {
				const retryAfter = parseFloat(response.headers.get('Retry-After'));
				console.log(`Awaiting global rate limit reset in ${retryAfter}s`);
				await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
				requestQueue.unshift(queued);
				continue;
			}
		}

		queued.resolve(response);
	}

	isProcessing = false;
}

/** @type {typeof makeRequest} */
export const get = makeRequest.bind(null, 'GET');

/** @type {typeof makeRequest} */
export const post = makeRequest.bind(null, 'POST');

/** @type {typeof makeRequest} */
export const put = makeRequest.bind(null, 'PUT');

/** @type {typeof makeRequest} */
export const patch = makeRequest.bind(null, 'PATCH');

/** @type {typeof makeRequest} */
export const del = makeRequest.bind(null, 'DELETE');

export function setToken(token) {
	DISCORD_TOKEN = token;
}
