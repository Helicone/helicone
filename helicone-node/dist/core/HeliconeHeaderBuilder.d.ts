import { IHeliconeConfigurationParameters } from "./IHeliconeConfigurationParameters";
export declare class HeliconeHeaderBuilder {
    private heliconeConfigParameters;
    private headers;
    constructor(heliconeConfigParameters: IHeliconeConfigurationParameters);
    withPropertiesHeader(): HeliconeHeaderBuilder;
    withCacheHeader(): HeliconeHeaderBuilder;
    withRetryHeader(): HeliconeHeaderBuilder;
    withRateLimitPolicyHeader(): HeliconeHeaderBuilder;
    withUserHeader(): HeliconeHeaderBuilder;
    build(): {
        [key: string]: string;
    };
    private getUserHeader;
    private getPropertyHeaders;
    private getCacheHeaders;
    private getRetryHeaders;
    private getRateLimitPolicyHeaders;
}
