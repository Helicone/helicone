import { getResponse } from "../managers/FeedbackManager";
import { FREQUENT_PRECENT_LOGGING, } from "../util/loggers/DBQueryTimer";
export class RequestResponseStore {
    database;
    queryTimer;
    valhalla;
    clickhouseWrapper;
    fallBackQueue;
    responseAndResponseQueueKV;
    constructor(database, queryTimer, valhalla, clickhouseWrapper, fallBackQueue, responseAndResponseQueueKV) {
        this.database = database;
        this.queryTimer = queryTimer;
        this.valhalla = valhalla;
        this.clickhouseWrapper = clickhouseWrapper;
        this.fallBackQueue = fallBackQueue;
        this.responseAndResponseQueueKV = responseAndResponseQueueKV;
    }
    async updateResponsePostgres(responsePayload) {
        const { responseId, requestId, response } = responsePayload;
        if (!responseId) {
            return { data: null, error: "Missing responseId" };
        }
        return await this.queryTimer
            .withTiming(this.database
            .from("response")
            .update(response)
            .match({ id: responseId, request: requestId }), {
            queryName: "update_response",
            percentLogging: FREQUENT_PRECENT_LOGGING,
        })
            .then((res) => {
            if (res.error) {
                return { data: null, error: res.error.message };
            }
            return { data: null, error: null };
        });
    }
    async addRequestNodeRelationship(job_id, node_id, request_id) {
        const insertResult = await this.database
            .from("job_node_request")
            .insert([{ job_id, node_id, request_id }]);
        if (insertResult.error) {
            return { data: null, error: JSON.stringify(insertResult) };
        }
        return { data: null, error: null };
    }
    async addJob(run) {
        const insertResult = await this.database.from("job").insert([run]);
        if (insertResult.error) {
            return { data: null, error: JSON.stringify(insertResult) };
        }
        return { data: null, error: null };
    }
    async updateJobStatus(jobId, status) {
        const updateResult = await this.queryTimer.withTiming(this.database
            .from("job")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", jobId), {
            queryName: "update_job_status",
        });
        if (updateResult.error) {
            return { data: null, error: JSON.stringify(updateResult.error) };
        }
        return { data: null, error: null };
    }
    async updateNodeStatus(nodeId, status) {
        const updateResult = await this.queryTimer.withTiming(this.database
            .from("job_node")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", nodeId), {
            queryName: "update_node_status",
        });
        if (updateResult.error) {
            return { data: null, error: JSON.stringify(updateResult.error) };
        }
        return { data: null, error: null };
    }
    async addNode(node, options) {
        const insertResult = await this.queryTimer.withTiming(this.database.from("job_node").insert([node]), {
            queryName: "insert_node",
        });
        if (insertResult.error) {
            return { data: null, error: JSON.stringify(insertResult) };
        }
        if (options.parent_job_id) {
            const insertResult = await this.queryTimer.withTiming(this.database.from("job_node_relationships").insert([
                {
                    node_id: node.id,
                    parent_node_id: options.parent_job_id,
                    job_id: node.job,
                },
            ]), {
                queryName: "insert_node_relationship",
            });
            if (insertResult.error) {
                return { data: null, error: JSON.stringify(insertResult) };
            }
        }
        return { data: null, error: null };
    }
    getModelFromResponse(responseData) {
        try {
            const body = responseData?.body;
            if (typeof body !== "object" || !body) {
                return "unknown";
            }
            if (Array.isArray(body)) {
                return "unknown";
            }
            return body["model"] || body.body["model"] || "unknown";
        }
        catch (e) {
            return "unknown";
        }
    }
    async updateResponse(responseId, requestId, response) {
        const payload = {
            responseId,
            requestId,
            response,
        };
        const res = await this.updateResponsePostgres(payload);
        const responseUpdate = await this.valhalla.patch("/v1/response", {
            model: this.getModelFromResponse(response),
            response_id: responseId,
            heliconeRequestId: requestId,
            http_status: response.status ?? null,
            responseReceivedAt: new Date().toISOString(),
            completion_tokens: response.completion_tokens ?? null,
            prompt_tokens: response.prompt_tokens ?? null,
            delay_ms: response.delay_ms ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            body: response?.body ?? null,
        });
        if (responseUpdate.error) {
            // console.error("Error updating response in valhalla:", responseUpdate);
            // return err(responseUpdate.error);
        }
        if (res.error) {
            console.error("Error inserting into response:", res.error);
            return res;
        }
        return { data: null, error: null };
    }
    async waitForResponse(requestId) {
        await getResponse(this.database, this.queryTimer, requestId);
    }
}
