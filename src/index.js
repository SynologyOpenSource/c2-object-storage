/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { AwsClient } from 'aws4fetch';
import { StatusCodes } from 'http-status-codes';

function filterHeaders(srcHeaders, skipHeaders = []) {
	// filter headers by given skipHeaders and headers starting with 'cf-'
	return new Headers(
		[...srcHeaders].filter(([key]) => {
			const k = key.toLowerCase();
			return !skipHeaders.includes(k) && !k.startsWith('cf-');
		}),
	);
}

function copyHeaders(srcHeaders, dstHeaders) {
	for (const [key, value] of srcHeaders.entries()) {
		dstHeaders.append(key, value);
	}
	return dstHeaders;
}

async function fetchObect(env, req) {
	const s3Client = new AwsClient({
		accessKeyId: env['ACCESS_KEY_ID'],
		secretAccessKey: env['SECRET_KEY'],
		service: 's3',
	});

	const skipSignHeaders = ['x-real-ip', 'x-forwarded-proto', 'accept-encoding'];
	// filter a set of headers that should not include in the signature
	const headers = filterHeaders(req.headers, skipSignHeaders);
	const request = await s3Client.sign(req.url, {
		method: req.method,
		headers: headers,
	});
	return fetch(request);
}

export default {
	async fetch(request, env, ctx) {
		if (request.method != 'GET' && request.method != 'HEAD') {
			return new Response('Method not allowed', { status: StatusCodes.METHOD_NOT_ALLOWED });
		}

		const reqURL = new URL(request.url);
		if (reqURL.pathname == `/${env['BUCKET_NAME']}` || reqURL.pathname == `/${env['BUCKET_NAME']}/`) {
			// 'forbid list bucket operation
			return new Response('Forbidden', { status: StatusCodes.FORBIDDEN });
		}

		if (!reqURL.pathname || !reqURL.pathname.startsWith(`/${env['BUCKET_NAME']}/`)) {
			return new Response('Not found', { status: StatusCodes.NOT_FOUND });
		}

		const cache = caches.default;
		const cacheKey = new Request(reqURL.toString(), request);

		let cacheResp = await cache.match(cacheKey);
		if (cacheResp) {
			return cacheResp;
		}

		let resp;
		try {
			const newURL = reqURL.toString().replace(reqURL.origin, env['C2_ENDPOINT']);
			const newReq = new Request(newURL, request);
			resp = await fetchObect(env, newReq);
		} catch (error) {
			if (error.$response) {
				return new Response('Error', { status: error.$response.statusCode });
			}
			return new Response('Internal Server Error', { status: StatusCodes.INTERNAL_SERVER_ERROR });
		}

		const cacheControl = env['cache_control'] ?? 'public';
		const maxAge = env['max_age'] ?? 300;
		const sMaxAge = env['s_max_age'] ?? 600;
		let newHeaders = new Headers({
			'Cache-Control': `${cacheControl}, max-age=${maxAge}, s-maxage=${sMaxAge}`,
			'access-control-allow-origin': '*',
		});
		copyHeaders(filterHeaders(resp.headers, ['access-control-allow-origin']), newHeaders);
		const newResp = new Response(resp.body, {
			status: resp.status,
			headers: newHeaders,
		});

		if (request.method == 'GET' && resp.status == StatusCodes.OK) {
			ctx.waitUntil(cache.put(cacheKey, newResp.clone()));
		}
		return newResp;
	},
};
