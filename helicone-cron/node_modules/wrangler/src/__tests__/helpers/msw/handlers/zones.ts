import { rest } from "msw";

export default [
	rest.get("*/zones", ({ url: { searchParams } }, res, context) => {
		return res(
			context.status(200),
			context.json({
				success: true,
				errors: [],
				messages: [],
				result:
					searchParams.get("name") === "exists.com"
						? [
								{
									id: "exists-com",
								},
						  ]
						: [],
			})
		);
	}),
];
