"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeliconeAsyncConfigurationManager = void 0;
const openai_1 = require("openai");
const HeliconeHeaderBuilder_1 = require("./HeliconeHeaderBuilder");
class HeliconeAsyncConfigurationManager {
    constructor(heliconeConfigParameters, configurationParameters, basePath, onHeliconeLog) {
        this.heliconeConfigParameters = heliconeConfigParameters;
        this.configurationParameters = configurationParameters;
        this.basePath = basePath !== null && basePath !== void 0 ? basePath : "https://api.hconeai.com";
        this.onHeliconeLog = onHeliconeLog;
        this.heliconeHeaders = new HeliconeHeaderBuilder_1.HeliconeHeaderBuilder(this.heliconeConfigParameters)
            .withPropertiesHeader()
            .withUserHeader()
            .build();
    }
    getOnHeliconeLog() {
        return this.onHeliconeLog;
    }
    getHeliconeAuthHeader() {
        return this.heliconeHeaders["Helicone-Auth"];
    }
    getBasePath() {
        return this.basePath;
    }
    getHeliconeHeaders() {
        return this.heliconeHeaders;
    }
    resolveConfiguration() {
        return new openai_1.Configuration(this.configurationParameters);
    }
}
exports.HeliconeAsyncConfigurationManager = HeliconeAsyncConfigurationManager;
