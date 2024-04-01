import { rest } from "msw";

export default [
	rest.get("*access-protected.com*", (_, response, cxt) => {
		return response.once(
			cxt.status(302),
			cxt.set("location", "access-protected-com.cloudflareaccess.com")
		);
	}),
	rest.get("*not-access-protected.com*", (_, response, cxt) => {
		return response.once(cxt.status(200), cxt.body("OK"));
	}),
];
