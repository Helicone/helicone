"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeliconeProxyOpenAIApi = void 0;
const openai_1 = require("openai");
class HeliconeProxyOpenAIApi extends openai_1.OpenAIApi {
    constructor(configurationProvider) {
        super(configurationProvider.resolveConfiguration());
    }
}
exports.HeliconeProxyOpenAIApi = HeliconeProxyOpenAIApi;
