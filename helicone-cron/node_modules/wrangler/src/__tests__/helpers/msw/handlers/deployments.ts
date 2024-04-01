import { rest } from "msw";

import type { DeploymentListRes } from "../../../../deployments";

export const mswSuccessDeployments = [
	rest.get(
		"*/accounts/:accountId/workers/deployments/by-script/:scriptTag",
		(_, response, context) =>
			response.once(
				context.status(200),
				context.json({
					success: true,
					errors: [],
					messages: [],
					result: {
						latest: {
							id: "Galaxy-Class",
							number: "1701-E",
							metadata: {
								author_id: "Picard-Gamma-6-0-7-3",
								author_email: "Jean-Luc-Picard@federation.org",
								source: "wrangler",
								created_on: "2021-01-01T00:00:00.000000Z",
								modified_on: "2021-01-01T00:00:00.000000Z",
							},
							resources: {
								script: "MOCK-TAG",
								bindings: [],
							},
						},
						items: [
							{
								id: "Galaxy-Class",
								number: "1701-E",
								metadata: {
									author_id: "Picard-Gamma-6-0-7-3",
									author_email: "Jean-Luc-Picard@federation.org",
									source: "wrangler",
									created_on: "2021-01-01T00:00:00.000000Z",
									modified_on: "2021-01-01T00:00:00.000000Z",
								},
							},
							{
								id: "Intrepid-Class",
								number: "NCC-74656",
								metadata: {
									author_id: "Kathryn-Jane-Gamma-6-0-7-3",
									author_email: "Kathryn-Janeway@federation.org",
									source: "wrangler",
									created_on: "2021-02-02T00:00:00.000000Z",
									modified_on: "2021-02-02T00:00:00.000000Z",
								},
							},
						],
					} as DeploymentListRes,
				})
			)
	),
];
