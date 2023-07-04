"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeliconeProxyConfigurationManager = void 0;
const openai_1 = require("openai");
const HeliconeHeaderBuilder_1 = require("./HeliconeHeaderBuilder");
class HeliconeProxyConfigurationManager {
    constructor(heliconeConfigParameters, configurationParameters, basePath) {
        this.heliconeConfigParameters = heliconeConfigParameters;
        this.configurationParameters = configurationParameters;
        this.basePath = basePath !== null && basePath !== void 0 ? basePath : "https://oai.hconeai.com/v1";
        this.heliconeHeaders = new HeliconeHeaderBuilder_1.HeliconeHeaderBuilder(this.heliconeConfigParameters)
            .withPropertiesHeader()
            .withCacheHeader()
            .withRetryHeader()
            .withRateLimitPolicyHeader()
            .withUserHeader()
            .build();
    }
    getOnHeliconeLog() {
        return undefined;
    }
    getBasePath() {
        return this.basePath;
    }
    getHeliconeAuthHeader() {
        return this.heliconeHeaders["Helicone-Auth"];
    }
    getHeliconeHeaders() {
        return this.heliconeHeaders;
    }
    resolveConfiguration() {
        const configuration = new openai_1.Configuration(this.configurationParameters);
        configuration.baseOptions = Object.assign(Object.assign({}, configuration.baseOptions), { headers: Object.assign(Object.assign({}, configuration.baseOptions.headers), this.heliconeHeaders) });
        configuration.basePath = this.getBasePath();
        return configuration;
    }
}
exports.HeliconeProxyConfigurationManager = HeliconeProxyConfigurationManager;
