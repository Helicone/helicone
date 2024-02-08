/* eslint-env browser */
import publicIp from 'public-ip';

export default async function isOnline(options) {
	options = {
		timeout: 5000,
		ipVersion: 4,
		...options,
	};

	if (!navigator?.onLine) {
		return false;
	}

	const publicIpFunctionName = options.ipVersion === 4 ? 'v4' : 'v6';

	try {
		await publicIp[publicIpFunctionName](options);
		return true;
	} catch {
		return false;
	}
}
