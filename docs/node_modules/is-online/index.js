import os from 'node:os';
import got, {CancelError} from 'got';
import publicIp from 'public-ip';
import pAny from 'p-any';
import pTimeout from 'p-timeout';

const appleCheck = options => {
	const gotPromise = got('https://captive.apple.com/hotspot-detect.html', {
		timeout: {
			request: options.timeout,
		},
		dnsLookupIpVersion: options.ipVersion,
		headers: {
			'user-agent': 'CaptiveNetworkSupport/1.0 wispr',
		},
	});

	const promise = (async () => {
		try {
			const {body} = await gotPromise;
			if (!body || !body.includes('Success')) {
				throw new Error('Apple check failed');
			}
		} catch (error) {
			if (!(error instanceof CancelError)) {
				throw error;
			}
		}
	})();

	promise.cancel = gotPromise.cancel;

	return promise;
};

// Note: It cannot be `async`` as then it looses the `.cancel()` method.
export default function isOnline(options) {
	options = {
		timeout: 5000,
		ipVersion: 4,
		...options,
	};

	if (Object.values(os.networkInterfaces()).flat().every(({internal}) => internal)) {
		return false;
	}

	if (![4, 6].includes(options.ipVersion)) {
		throw new TypeError('`ipVersion` must be 4 or 6');
	}

	const publicIpFunctionName = options.ipVersion === 4 ? 'v4' : 'v6';

	const queries = [];

	const promise = pAny([
		(async () => {
			const query = publicIp[publicIpFunctionName](options);
			queries.push(query);
			await query;
			return true;
		})(),
		(async () => {
			const query = publicIp[publicIpFunctionName]({...options, onlyHttps: true});
			queries.push(query);
			await query;
			return true;
		})(),
		(async () => {
			const query = appleCheck(options);
			queries.push(query);
			await query;
			return true;
		})(),
	]);

	return pTimeout(promise, options.timeout).catch(() => {
		for (const query of queries) {
			query.cancel();
		}

		return false;
	});

	// TODO: Use this instead when supporting AbortController.
	// try {
	// 	return await pTimeout(promise, options.timeout);
	// } catch {
	// 	for (const query of queries) {
	// 		query.cancel();
	// 	}

	// 	return false;
	// }
}
