"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeliconeOpenAIApi = void 0;
const openai_1 = require("openai");
class HeliconeOpenAIApi extends openai_1.OpenAIApi {
    constructor(configurationProvider) {
        super(configurationProvider.resolveConfiguration());
    }
}
exports.HeliconeOpenAIApi = HeliconeOpenAIApi;
