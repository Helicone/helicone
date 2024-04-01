import { rest } from "msw";

export const mswSuccessR2handlers = [
	// List endpoint r2Buckets
	rest.get("*/accounts/:accountId/r2/buckets", (_, response, context) =>
		response.once(
			context.status(200),
			context.json({
				success: true,
				errors: [],
				messages: [],
				result: {
					buckets: [
						{ name: "bucket-1", creation_date: "01-01-2001" },
						{ name: "bucket-2", creation_date: "01-01-2001" },
					],
				},
			})
		)
	),
	rest.post("*/accounts/:accountId/r2/buckets", (_, response, context) =>
		response.once(
			context.status(200),
			context.json({ success: true, errors: [], messages: [], result: {} })
		)
	),
	rest.put(
		"*/accounts/:accountId/r2/buckets/:bucketName",
		(_, response, context) =>
			response.once(
				context.status(200),
				context.json({ success: true, errors: [], messages: [], result: {} })
			)
	),
	rest.delete(
		"*/accounts/:accountId/r2/buckets/:bucketName",
		(_, response, context) =>
			response.once(
				context.status(200),
				context.json({ success: true, errors: [], messages: [], result: null })
			)
	),
	rest.get(
		"*/accounts/:accountId/r2/buckets/:bucketName/objects/:objectName",
		(_, response, context) => {
			const imageBuffer = Buffer.from("wormhole-img.png");
			return response.once(
				context.set("Content-Length", imageBuffer.byteLength.toString()),
				context.set("Content-Type", "image/png"),
				context.status(200),
				context.body(imageBuffer)
			);
		}
	),
	rest.put(
		"*/accounts/:accountId/r2/buckets/:bucketName/objects/:objectName",
		(_, response, context) =>
			response.once(
				context.status(200),
				context.json({
					success: true,
					errors: [],
					messages: [],
					result: {
						accountId: "some-account-id",
						bucketName: "bucketName-object-test",
						objectName: "wormhole-img.png",
					},
				})
			)
	),
	rest.delete(
		"*/accounts/:accountId/r2/buckets/:bucketName/objects/:objectName",
		(_, response, context) =>
			response.once(
				context.status(200),
				context.json({ success: true, errors: [], messages: [], result: null })
			)
	),
];
