"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeliconeAsyncOpenAIApi = void 0;
const openai_1 = require("openai");
const HeliconeAsyncLogger_1 = require("./HeliconeAsyncLogger");
const stream_1 = require("stream");
class HeliconeAsyncOpenAIApi extends openai_1.OpenAIApi {
    constructor(configurationProvider) {
        super(configurationProvider.resolveConfiguration());
        this.configurationManager = configurationProvider;
        this.logger = new HeliconeAsyncLogger_1.HeliconeAsyncLogger(configurationProvider);
    }
    createChatCompletion(createChatCompletionRequest, options) {
        const _super = Object.create(null, {
            createChatCompletion: { get: () => super.createChatCompletion }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return this.wrapApiCall(_super.createChatCompletion.bind(this))(createChatCompletionRequest, options);
        });
    }
    createCompletion(createCompletionRequest, options) {
        const _super = Object.create(null, {
            createCompletion: { get: () => super.createCompletion }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return this.wrapApiCall(_super.createCompletion.bind(this))(createCompletionRequest, options);
        });
    }
    createEdit(createEditRequest, options) {
        const _super = Object.create(null, {
            createEdit: { get: () => super.createEdit }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return this.wrapApiCall(_super.createEdit.bind(this))(createEditRequest, options);
        });
    }
    createEmbedding(createEmbeddingRequest, options) {
        const _super = Object.create(null, {
            createEmbedding: { get: () => super.createEmbedding }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return this.wrapApiCall(_super.createEmbedding.bind(this))(createEmbeddingRequest, options);
        });
    }
    createImage(createImageRequest, options) {
        const _super = Object.create(null, {
            createImage: { get: () => super.createImage }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return this.wrapApiCall(_super.createImage.bind(this))(createImageRequest, options);
        });
    }
    createModeration(createModerationRequest, options) {
        const _super = Object.create(null, {
            createModeration: { get: () => super.createModeration }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return this.wrapApiCall(_super.createModeration.bind(this))(createModerationRequest, options);
        });
    }
    wrapApiCall(apiCall) {
        return (...args) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (this.basePath === undefined)
                throw new Error("Base path is undefined");
            const providerRequest = {
                url: this.basePath,
                json: args[0],
                meta: this.configurationManager.getHeliconeHeaders(),
            };
            // Checking if stream is set to true and set responseType to stream
            if (((_a = args[0]) === null || _a === void 0 ? void 0 : _a.stream) === true) {
                args[1] = { responseType: "stream" };
            }
            const startTime = Date.now();
            let result;
            try {
                result = yield apiCall(...args);
            }
            catch (error) {
                const endTime = Date.now();
                const asyncLogRequest = {
                    providerRequest: providerRequest,
                    providerResponse: {
                        json: {
                            error: error.message,
                        },
                        status: (_b = error.response) === null || _b === void 0 ? void 0 : _b.status,
                        headers: (_c = error.response) === null || _c === void 0 ? void 0 : _c.headers,
                    },
                    timing: HeliconeAsyncLogger_1.HeliconeAsyncLogger.createTiming(startTime, endTime),
                };
                this.logger.log(asyncLogRequest, HeliconeAsyncLogger_1.Provider.OPENAI);
                throw error;
            }
            if (result.headers["content-type"] === "text/event-stream" && result.data instanceof stream_1.Readable) {
                this.handleStreamLogging(result, startTime, providerRequest);
            }
            else {
                const endTime = Date.now();
                const asyncLogRequest = {
                    providerRequest: providerRequest,
                    providerResponse: {
                        json: result.data,
                        status: result.status,
                        headers: result.headers,
                    },
                    timing: HeliconeAsyncLogger_1.HeliconeAsyncLogger.createTiming(startTime, endTime),
                };
                this.logger.log(asyncLogRequest, HeliconeAsyncLogger_1.Provider.OPENAI);
            }
            return result;
        });
    }
    handleStreamLogging(result, startTime, providerRequest) {
        // Splitting stream into two
        const logStream = new stream_1.PassThrough();
        result.data.pipe(logStream);
        // Logging stream
        const logData = [];
        logStream.on("data", (chunk) => {
            console.log(`Received ${chunk}`);
            const lines = chunk
                .toString()
                .split("\n")
                .filter((line) => line.trim() !== "");
            for (const line of lines) {
                const message = line.replace(/^data: /, "");
                if (message === "[DONE]") {
                    return;
                }
                try {
                    const parsedMessage = JSON.parse(message);
                    logData.push(parsedMessage);
                }
                catch (error) {
                    throw new Error("Error parsing message as JSON: " + error);
                }
            }
        });
        logStream.on("end", () => {
            const endTime = Date.now();
            const asyncLogRequest = {
                providerRequest: providerRequest,
                providerResponse: {
                    json: { streamed_data: logData },
                    status: result.status,
                    headers: result.headers,
                },
                timing: HeliconeAsyncLogger_1.HeliconeAsyncLogger.createTiming(startTime, endTime),
            };
            this.logger.log(asyncLogRequest, HeliconeAsyncLogger_1.Provider.OPENAI).then(() => {
                const func = this.configurationManager.getOnHeliconeLog();
                if (func)
                    func(result);
            });
        });
    }
}
exports.HeliconeAsyncOpenAIApi = HeliconeAsyncOpenAIApi;
