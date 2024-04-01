import http from "http";
import net from "net";
import bodyParser from "body-parser";
import express from "express";
import { createHttpTerminator } from "http-terminator";
import { fetch } from "undici";
import { logger } from "./logger";

import type { Config } from "./config";
import type { Server } from "http";
import type { HttpTerminator } from "http-terminator";

const DEV_REGISTRY_PORT = "6284";
const DEV_REGISTRY_HOST = `http://localhost:${DEV_REGISTRY_PORT}`;

let server: Server;
let terminator: HttpTerminator;

export type WorkerRegistry = Record<string, WorkerDefinition>;

type WorkerDefinition = {
	port: number | undefined;
	protocol: "http" | "https" | undefined;
	host: string | undefined;
	mode: "local" | "remote";
	headers?: Record<string, string>;
	durableObjects: { name: string; className: string }[];
	durableObjectsHost?: string;
	durableObjectsPort?: number;
};

/**
 * A helper function to check whether our service registry is already running
 */
async function isPortAvailable() {
	return new Promise((resolve, reject) => {
		const netServer = net
			.createServer()
			.once("error", (err) => {
				netServer.close();
				if ((err as unknown as { code: string }).code === "EADDRINUSE") {
					resolve(false);
				} else {
					reject(err);
				}
			})
			.once("listening", () => {
				netServer.close();
				resolve(true);
			});
		netServer.listen(DEV_REGISTRY_PORT);
	});
}

const jsonBodyParser = bodyParser.json();

/**
 * Start the service registry. It's a simple server
 * that exposes endpoints for registering and unregistering
 * services, as well as getting the state of the registry.
 */
export async function startWorkerRegistry() {
	if ((await isPortAvailable()) && !server) {
		const app = express();

		let workers: WorkerRegistry = {};
		app
			.get("/workers", async (req, res) => {
				res.json(workers);
			})
			.post("/workers/:workerId", jsonBodyParser, async (req, res) => {
				workers[req.params.workerId] = req.body;
				res.json(null);
			})
			.delete(`/workers/:workerId`, async (req, res) => {
				delete workers[req.params.workerId];
				res.json(null);
			})
			.delete("/workers", async (req, res) => {
				workers = {};
				res.json(null);
			});
		server = http.createServer(app);
		terminator = createHttpTerminator({ server });
		server.listen(DEV_REGISTRY_PORT);

		/**
		 * The registry server may have already been started by another wrangler process.
		 * If wrangler processes are run in parallel, isPortAvailable() can return true
		 * while another process spins up the server
		 */
		server.once("error", (err) => {
			if ((err as unknown as { code: string }).code !== "EADDRINUSE") {
				throw err;
			}
		});
	}
}

/**
 * Stop the service registry.
 */
export async function stopWorkerRegistry() {
	await terminator?.terminate();
}

/**
 * Register a worker in the registry.
 */
export async function registerWorker(
	name: string,
	definition: WorkerDefinition
) {
	try {
		return await fetch(`${DEV_REGISTRY_HOST}/workers/${name}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(definition),
		});
	} catch (e) {
		if (
			!["ECONNRESET", "ECONNREFUSED"].includes(
				(e as unknown as { cause?: { code?: string } }).cause?.code || "___"
			)
		) {
			logger.error("Failed to register worker in local service registry", e);
		} else {
			logger.debug("Failed to register worker in local service registry", e);
		}
	}
}

/**
 * Unregister a worker from the registry.
 */
export async function unregisterWorker(name: string) {
	try {
		await fetch(`${DEV_REGISTRY_HOST}/workers/${name}`, {
			method: "DELETE",
		});
	} catch (e) {
		if (
			!["ECONNRESET", "ECONNREFUSED"].includes(
				(e as unknown as { cause?: { code?: string } }).cause?.code || "___"
			)
		) {
			throw e;
			// logger.error("failed to unregister worker", e);
		}
	}
}

/**
 * Get the state of the service registry.
 */
export async function getRegisteredWorkers(): Promise<
	WorkerRegistry | undefined
> {
	try {
		const response = await fetch(`${DEV_REGISTRY_HOST}/workers`);
		return (await response.json()) as WorkerRegistry;
	} catch (e) {
		if (
			!["ECONNRESET", "ECONNREFUSED"].includes(
				(e as unknown as { cause?: { code?: string } }).cause?.code || "___"
			)
		) {
			throw e;
		}
	}
}

/**
 * a function that takes your serviceNames and durableObjectNames and returns a
 * list of the running workers that we're bound to
 */
export async function getBoundRegisteredWorkers({
	services,
	durableObjects,
}: {
	services: Config["services"] | undefined;
	durableObjects: Config["durable_objects"] | undefined;
}) {
	const serviceNames = (services || []).map(
		(serviceBinding) => serviceBinding.service
	);
	const durableObjectServices = (
		durableObjects || { bindings: [] }
	).bindings.map((durableObjectBinding) => durableObjectBinding.script_name);

	const workerDefinitions = await getRegisteredWorkers();
	const filteredWorkers = Object.fromEntries(
		Object.entries(workerDefinitions || {}).filter(
			([key, _value]) =>
				serviceNames.includes(key) || durableObjectServices.includes(key)
		)
	);
	return filteredWorkers;
}
