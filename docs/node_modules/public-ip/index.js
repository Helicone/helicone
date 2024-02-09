import {promisify} from 'node:util';
import dgram from 'node:dgram';
import dns from 'dns-socket';
import got, {CancelError} from 'got';
import isIp from 'is-ip';

export class IpNotFoundError extends Error {
	constructor(options) {
		super('Could not get the public IP address', options);
		this.name = 'IpNotFoundError';
	}
}

const defaults = {
	timeout: 5000,
	onlyHttps: false,
};

const dnsServers = [
	{
		v4: {
			servers: [
				'208.67.222.222',
				'208.67.220.220',
				'208.67.222.220',
				'208.67.220.222',
			],
			name: 'myip.opendns.com',
			type: 'A',
		},
		v6: {
			servers: [
				'2620:0:ccc::2',
				'2620:0:ccd::2',
			],
			name: 'myip.opendns.com',
			type: 'AAAA',
		},
	},
	{
		v4: {
			servers: [
				'216.239.32.10',
				'216.239.34.10',
				'216.239.36.10',
				'216.239.38.10',
			],
			name: 'o-o.myaddr.l.google.com',
			type: 'TXT',
			transform: ip => ip.replace(/"/g, ''),
		},
		v6: {
			servers: [
				'2001:4860:4802:32::a',
				'2001:4860:4802:34::a',
				'2001:4860:4802:36::a',
				'2001:4860:4802:38::a',
			],
			name: 'o-o.myaddr.l.google.com',
			type: 'TXT',
			transform: ip => ip.replace(/"/g, ''),
		},
	},
];

const type = {
	v4: {
		dnsServers: dnsServers.map(({v4: {servers, ...question}}) => ({
			servers, question,
		})),
		httpsUrls: [
			'https://icanhazip.com/',
			'https://api.ipify.org/',
		],
	},
	v6: {
		dnsServers: dnsServers.map(({v6: {servers, ...question}}) => ({
			servers, question,
		})),
		httpsUrls: [
			'https://icanhazip.com/',
			'https://api6.ipify.org/',
		],
	},
};

const queryDns = (version, options) => {
	const data = type[version];

	const socket = dns({
		retries: 0,
		maxQueries: 1,
		socket: dgram.createSocket(version === 'v6' ? 'udp6' : 'udp4'),
		timeout: options.timeout,
	});

	const socketQuery = promisify(socket.query.bind(socket));

	const promise = (async () => {
		let lastError;

		for (const dnsServerInfo of data.dnsServers) {
			const {servers, question} = dnsServerInfo;
			for (const server of servers) {
				if (socket.destroyed) {
					return;
				}

				try {
					const {name, type, transform} = question;

					// eslint-disable-next-line no-await-in-loop
					const dnsResponse = await socketQuery({questions: [{name, type}]}, 53, server);

					const {
						answers: {
							0: {
								data,
							},
						},
					} = dnsResponse;

					const response = (typeof data === 'string' ? data : data.toString()).trim();

					const ip = transform ? transform(response) : response;

					if (ip && isIp[version](ip)) {
						socket.destroy();
						return ip;
					}
				} catch (error) {
					lastError = error;
				}
			}
		}

		socket.destroy();

		throw new IpNotFoundError({cause: lastError});
	})();

	promise.cancel = () => {
		socket.destroy();
	};

	return promise;
};

const queryHttps = (version, options) => {
	let cancel;

	const promise = (async () => {
		try {
			const requestOptions = {
				dnsLookupIpVersion: version === 'v6' ? 6 : 4,
				retry: {
					limit: 0,
				},
				timeout: {
					request: options.timeout,
				},
			};

			const urls = [
				...type[version].httpsUrls,
				...(options.fallbackUrls ?? []),
			];

			let lastError;
			for (const url of urls) {
				try {
					// Note: We use `.get` to allow for mocking.
					const gotPromise = got.get(url, requestOptions);
					cancel = gotPromise.cancel;

					// eslint-disable-next-line no-await-in-loop
					const response = await gotPromise;

					const ip = (response.body || '').trim();

					if (ip && isIp[version](ip)) {
						return ip;
					}
				} catch (error) {
					lastError = error;

					if (error instanceof CancelError) {
						throw error;
					}
				}
			}

			throw new IpNotFoundError({cause: lastError});
		} catch (error) {
			// Don't throw a cancellation error for consistency with DNS
			if (!(error instanceof CancelError)) {
				throw error;
			}
		}
	})();

	promise.cancel = function () {
		return cancel.apply(this);
	};

	return promise;
};

const queryAll = (version, options) => {
	let cancel;
	const promise = (async () => {
		let response;
		const dnsPromise = queryDns(version, options);
		cancel = dnsPromise.cancel;
		try {
			response = await dnsPromise;
		} catch {
			const httpsPromise = queryHttps(version, options);
			cancel = httpsPromise.cancel;
			response = await httpsPromise;
		}

		return response;
	})();

	promise.cancel = cancel;

	return promise;
};

const publicIp = {};

publicIp.v4 = options => {
	options = {
		...defaults,
		...options,
	};

	if (!options.onlyHttps) {
		return queryAll('v4', options);
	}

	if (options.onlyHttps) {
		return queryHttps('v4', options);
	}

	return queryDns('v4', options);
};

publicIp.v6 = options => {
	options = {
		...defaults,
		...options,
	};

	if (!options.onlyHttps) {
		return queryAll('v6', options);
	}

	if (options.onlyHttps) {
		return queryHttps('v6', options);
	}

	return queryDns('v6', options);
};

export default publicIp;

export {CancelError} from 'got';
