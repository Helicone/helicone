export async function callJawn<T, R>(
	path: string,
	verb: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH',
	body: T | null,
	env: Env,
) {
	let response;
	if (body !== null) {
		response = await fetch(`${env.VALHALLA_URL}${path}`, {
			method: verb,
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json',
				Authorization: env.HELICONE_MANUAL_ACCESS_KEY,
			},
		});
	} else {
		response = await fetch(`${env.VALHALLA_URL}${path}`, {
			method: verb,
			headers: {
				'Content-Type': 'application/json',
				Authorization: env.HELICONE_MANUAL_ACCESS_KEY,
			},
		});
	}

	return response.json() as Promise<R>;
}
