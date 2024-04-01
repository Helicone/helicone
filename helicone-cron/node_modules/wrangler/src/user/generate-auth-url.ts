interface GenerateAuthUrlProps {
	authUrl: string;
	clientId: string;
	callbackUrl: string;
	scopes: string[];
	stateQueryParam: string;
	codeChallenge: string;
}

/**
 * generateAuthUrl was extracted from getAuthURL in user.tsx
 * to make it possible to mock the generated URL
 */
export const generateAuthUrl = ({
	authUrl,
	clientId,
	callbackUrl,
	scopes,
	stateQueryParam,
	codeChallenge,
}: GenerateAuthUrlProps) => {
	return (
		authUrl +
		`?response_type=code&` +
		`client_id=${encodeURIComponent(clientId)}&` +
		`redirect_uri=${encodeURIComponent(callbackUrl)}&` +
		// we add offline_access manually for every request
		`scope=${encodeURIComponent([...scopes, "offline_access"].join(" "))}&` +
		`state=${stateQueryParam}&` +
		`code_challenge=${encodeURIComponent(codeChallenge)}&` +
		`code_challenge_method=S256`
	);
};
