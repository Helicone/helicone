import { authenticateRequest as authenticateProviderRequest, buildEndpointUrl, buildModelId, getEndpoint, getModelEndpoints, getProvider, } from "@helicone-package/cost/models";
import { buildRequestBody } from "@helicone-package/cost/models/providers";
import { toAnthropic } from "../clients/llmmapper/providers/openai/request/toAnthropic";
import { APIKeysManager } from "../managers/APIKeysManager";
import { err, isErr, ok } from "./results";
import { createFallbackEndpoint } from "@helicone-package/cost/models/registry";
const DEFAULT_REGION = "us-west-1";
const enableStreamUsage = async (requestWrapper) => {
    const jsonBody = (await requestWrapper.getJson());
    const bodyWithUsage = {
        ...jsonBody,
        stream_options: {
            ...(jsonBody.stream_options || {}),
            include_usage: true,
        },
    };
    return JSON.stringify(bodyWithUsage);
};
export const getBody = async (requestWrapper) => {
    if (requestWrapper.getMethod() === "GET") {
        return null;
    }
    if (requestWrapper.heliconeHeaders.featureFlags.streamUsage) {
        return enableStreamUsage(requestWrapper);
    }
    return await requestWrapper.getText();
};
export const authenticate = async (requestWrapper, env, store) => {
    const apiKeyManager = new APIKeysManager(store, env);
    const rawAPIKey = await requestWrapper.getRawProviderAuthHeader();
    const hashedAPIKey = await requestWrapper.getProviderAuthHeader();
    const orgId = await apiKeyManager.getAPIKeyWithFetch(hashedAPIKey ?? "");
    return { orgId, rawAPIKey };
};
const validateModelString = (model) => {
    const modelParts = model.split("/");
    if (modelParts.length !== 2) {
        const endpointsResult = getModelEndpoints(model);
        if (endpointsResult.error ||
            !endpointsResult.data ||
            endpointsResult.data.length === 0) {
            return err({
                type: "invalid_format",
                message: "Invalid model",
                code: 400,
            });
        }
        return ok({ type: "endpoints", endpoints: endpointsResult.data });
    }
    const [modelName, providerName] = modelParts;
    const providerResult = getProvider(providerName);
    if (providerResult.error || !providerResult.data) {
        return err({
            type: "invalid_format",
            message: "Invalid model",
            code: 400,
        });
    }
    return ok({
        type: "direct",
        provider: providerName,
        modelName,
        providerConfig: providerResult.data,
    });
};
const authenticateRequest = async (requestWrapper, providerKey, model, body, heliconeHeaders, targetBaseUrl, endpoint) => {
    requestWrapper.resetObject();
    requestWrapper.setHeader("Helicone-Auth", requestWrapper.getAuthorization() ?? "");
    requestWrapper.setUrl(targetBaseUrl ?? requestWrapper.url.toString());
    // Use the unified authenticate function from the cost package
    const authResult = await authenticateProviderRequest(endpoint, {
        config: providerKey.config || {},
        apiKey: providerKey.decrypted_provider_key,
        secretKey: providerKey.decrypted_provider_secret_key || undefined,
        bodyMapping: heliconeHeaders.gatewayConfig.bodyMapping,
        requestMethod: requestWrapper.getMethod(),
        requestUrl: targetBaseUrl ?? requestWrapper.url.toString(),
        requestBody: body,
    });
    if (authResult.error) {
        throw new Error(`Authentication failed: ${authResult.error}`);
    }
    for (const [key, value] of Object.entries(authResult.data?.headers || {})) {
        requestWrapper.setHeader(key, value);
    }
};
const parseErrorResponse = async (response) => {
    try {
        const responseBody = await response.json();
        const errorMessage = responseBody?.message ??
            responseBody?.error?.message ??
            response.statusText;
        return err({
            type: "request_failed",
            message: errorMessage,
            code: response.status,
        });
    }
    catch {
        return err({
            type: "request_failed",
            message: response.statusText,
            code: response.status,
        });
    }
};
const attemptDirectProviderRequest = async (directProviderEndpoint, requestWrapper, forwarder, providerKeysManager, orgId, parsedBody) => {
    const { provider, modelName } = directProviderEndpoint;
    const providerKey = await providerKeysManager.getProviderKeyWithFetch(provider, orgId);
    if (!providerKey) {
        return err({
            type: "missing_provider_key",
            message: "Missing/Incorrect provider key",
            code: 400,
        });
    }
    const endpointResult = getEndpoint(modelName, provider);
    const endpoint = endpointResult.error || !endpointResult.data
        ? createFallbackEndpoint(modelName, provider)
        : endpointResult.data;
    const config = providerKey.config;
    let providerModelId;
    if (isErr(endpointResult)) {
        providerModelId = modelName;
    }
    else {
        const modelIdResult = buildModelId(endpoint, {
            region: config?.region ?? DEFAULT_REGION,
            crossRegion: config?.crossRegion === "true",
            projectId: config?.projectId,
        });
        providerModelId =
            modelIdResult.error || !modelIdResult.data
                ? modelName
                : modelIdResult.data;
    }
    const body = await buildRequestBody(endpoint, {
        parsedBody,
        model: providerModelId,
        provider,
        bodyMapping: requestWrapper.heliconeHeaders.gatewayConfig.bodyMapping,
        toAnthropic: toAnthropic,
    });
    if (isErr(body) || !body.data) {
        return err({
            type: "request_failed",
            message: body.error || "Failed to build request body",
            code: 500,
        });
    }
    requestWrapper.setBody(body.data);
    const targetBaseUrlResult = buildEndpointUrl(endpoint, {
        region: config?.region ?? config?.location ?? DEFAULT_REGION,
        crossRegion: config?.crossRegion === "true",
        projectId: config?.projectId,
        deploymentName: config?.deploymentName,
        resourceName: config?.resourceName,
    });
    if (targetBaseUrlResult.error || !targetBaseUrlResult.data) {
        return err({
            type: "request_failed",
            message: targetBaseUrlResult.error || "Failed to get target base URL",
            code: 500,
        });
    }
    const targetBaseUrl = targetBaseUrlResult.data;
    await authenticateRequest(requestWrapper, providerKey, providerModelId, body.data, requestWrapper.heliconeHeaders, targetBaseUrl, endpoint);
    try {
        const response = await forwarder(targetBaseUrl);
        if (response.ok) {
            return ok(response);
        }
        return await parseErrorResponse(response);
    }
    catch (error) {
        return err({
            type: "request_failed",
            message: error instanceof Error ? error.message : "Unknown error",
            code: 500,
        });
    }
};
const attemptEndpointsProviderRequest = async (modelName, endpointsProviderEndpoint, requestWrapper, forwarder, providerKeysManager, orgId, parsedBody) => {
    const { endpoints } = endpointsProviderEndpoint;
    let error = null;
    for (const endpoint of endpoints) {
        const providerResult = getProvider(endpoint.provider);
        if (isErr(providerResult) || !providerResult.data) {
            continue;
        }
        const result = await attemptDirectProviderRequest({
            type: "direct",
            provider: endpoint.provider,
            modelName,
            providerConfig: providerResult.data,
        }, requestWrapper, forwarder, providerKeysManager, orgId, parsedBody);
        if (!isErr(result)) {
            return result;
        }
        error = result.error;
    }
    return err(error ?? {
        type: "request_failed",
        message: "All models failed",
        code: 500,
    });
};
const attemptModelRequest = async ({ model, requestWrapper, forwarder, providerKeysManager, orgId, parsedBody, }) => {
    const result = validateModelString(model);
    if (isErr(result)) {
        return err(result.error);
    }
    if (result.data.type == "direct") {
        const directProviderRequestResult = await attemptDirectProviderRequest(result.data, requestWrapper, forwarder, providerKeysManager, orgId, parsedBody);
        return directProviderRequestResult;
    }
    const endpointsProviderRequestResult = await attemptEndpointsProviderRequest(model, result.data, requestWrapper, forwarder, providerKeysManager, orgId, parsedBody);
    return endpointsProviderRequestResult;
};
export const attemptModelRequestWithFallback = async ({ models, requestWrapper, forwarder, providerKeysManager, promptManager, orgId, parsedBody, }) => {
    if (models.length === 0) {
        return err({
            type: "invalid_format",
            message: "No models provided",
            code: 400,
        });
    }
    if (parsedBody.prompt_id) {
        const result = await promptManager.getMergedPromptBody(parsedBody, orgId);
        if (isErr(result)) {
            return err({
                type: "invalid_prompt",
                message: result.error,
                code: 400,
            });
        }
        if (result.data.errors && result.data.errors.length > 0) {
            return err({
                type: "invalid_prompt",
                message: result.data.errors
                    .map((error) => `Variable '${error.variable}' is '${error.expected}' but got '${error.value}'`)
                    .join("\n"),
                code: 400,
            });
        }
        requestWrapper.setPrompt2025Settings({
            promptId: parsedBody.prompt_id,
            promptVersionId: result.data.promptVersionId,
            inputs: parsedBody.inputs,
            environment: parsedBody.environment,
        });
        parsedBody = result.data.body;
    }
    let error = null;
    for (const model of models) {
        const result = await attemptModelRequest({
            model,
            requestWrapper,
            forwarder,
            providerKeysManager,
            orgId,
            parsedBody,
        });
        if (!isErr(result)) {
            return result;
        }
        error = result.error;
    }
    return err(error ?? {
        type: "request_failed",
        message: "All models failed",
        code: 500,
    });
};
