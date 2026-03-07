import { describe, it, expect } from "vitest";
import { z } from "zod";
import { jsonPreprocess } from "../lib/json-preprocess.js";

describe("jsonPreprocess", () => {
	const objectSchema = z.object({
		name: z.string(),
		value: z.number(),
	});

	it("passes through native objects unchanged", () => {
		const schema = jsonPreprocess(objectSchema);
		const result = schema.parse({ name: "test", value: 42 });
		expect(result).toEqual({ name: "test", value: 42 });
	});

	it("parses a JSON string into an object before validation", () => {
		const schema = jsonPreprocess(objectSchema);
		const result = schema.parse('{"name": "test", "value": 42}');
		expect(result).toEqual({ name: "test", value: 42 });
	});

	it("rejects a parsed JSON string that doesn't match the schema", () => {
		const schema = jsonPreprocess(objectSchema);
		expect(() => schema.parse('{"name": 123}')).toThrow();
	});

	it("preserves the 'all' literal string without parsing", () => {
		const unionSchema = z.union([objectSchema, z.literal("all")]);
		const schema = jsonPreprocess(unionSchema);
		const result = schema.parse("all");
		expect(result).toBe("all");
	});

	it("passes through invalid JSON strings for the schema to reject", () => {
		const schema = jsonPreprocess(objectSchema);
		expect(() => schema.parse("not valid json")).toThrow();
	});

	it("passes through non-string values (numbers, booleans, null)", () => {
		const numberSchema = jsonPreprocess(z.number());
		expect(numberSchema.parse(42)).toBe(42);

		const boolSchema = jsonPreprocess(z.boolean());
		expect(boolSchema.parse(true)).toBe(true);
	});

	it("works with nested filter schemas", () => {
		const filterSchema = z.union([
			z.object({
				request_response_rmt: z.object({
					request_id: z.object({
						equals: z.string(),
					}).optional(),
				}).optional(),
			}),
			z.literal("all"),
		]);

		const schema = jsonPreprocess(filterSchema);

		// JSON string with nested filter
		const jsonInput = '{"request_response_rmt": {"request_id": {"equals": "abc-123"}}}';
		const result = schema.parse(jsonInput);
		expect(result).toEqual({
			request_response_rmt: {
				request_id: { equals: "abc-123" },
			},
		});

		// "all" literal still works
		expect(schema.parse("all")).toBe("all");

		// Native object still works
		const nativeResult = schema.parse({ request_response_rmt: { request_id: { equals: "xyz" } } });
		expect(nativeResult).toEqual({ request_response_rmt: { request_id: { equals: "xyz" } } });
	});

	it("works with sort schemas", () => {
		const sortSchema = z.object({
			created_at: z.union([z.literal("asc"), z.literal("desc")]).optional(),
		});

		const schema = jsonPreprocess(sortSchema);
		const result = schema.parse('{"created_at": "desc"}');
		expect(result).toEqual({ created_at: "desc" });
	});
});
