import { rest } from "msw";
import type { WorkerMetadata } from "../../../../create-worker-upload-form";

const bindings: Record<string, WorkerMetadata["bindings"]> = {
	"durable-object": [
		{
			type: "durable_object_namespace",
			name: "TestDO",
			class_name: "TestDO",
		},
	],
};
const scripts: Record<string, string> = {
	websocket: `new WebSocket("ws://dummy")`,
	response: `return new Response("ok")`,
};
function getBindings(scriptName: string) {
	return scriptName.split("--").flatMap((part) => bindings[part] ?? []);
}
function getScript(scriptName: string) {
	return `export default {fetch(request){
    ${scriptName
			.split("--")
			.map((part) => scripts[part] ?? "")
			.join(";\n")}
  }}`;
}
export default [
	rest.get(
		"*/accounts/:accountId/workers/services/:scriptName/environments/:env/content",
		({ params: { scriptName } }, res, context) => {
			return res(
				context.status(200),
				context.text(getScript(scriptName as string))
			);
		}
	),
	rest.get(
		"*/accounts/:accountId/workers/scripts/:scriptName",
		({ params: { scriptName } }, res, context) => {
			return res(
				context.status(200),
				context.text(getScript(scriptName as string))
			);
		}
	),
	rest.get(
		"*/accounts/:accountId/workers/services/:scriptName/environments/:env/bindings",
		({ params: { scriptName } }, res, context) => {
			return res(
				context.status(200),
				context.json({
					success: true,
					errors: [],
					messages: [],
					result: getBindings(scriptName as string),
				})
			);
		}
	),
	rest.get(
		"*/accounts/:accountId/workers/scripts/:scriptName/bindings",
		({ params: { scriptName } }, res, context) => {
			return res(
				context.status(200),
				context.json({
					success: true,
					errors: [],
					messages: [],
					result: getBindings(scriptName as string),
				})
			);
		}
	),
];
