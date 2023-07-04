import { IHeliconeConfigurationManager } from '../core/IHeliconeConfigurationManager';
export type HeliconeAyncLogRequest = {
    providerRequest: ProviderRequest;
    providerResponse: ProviderResponse;
    timing: Timing;
};
export type ProviderRequest = {
    url: string;
    json: {
        [key: string]: any;
    };
    meta: Record<string, string>;
};
export type ProviderResponse = {
    json: {
        [key: string]: any;
    };
    status: number;
    headers: Record<string, string>;
};
export type Timing = {
    startTime: {
        seconds: number;
        milliseconds: number;
    };
    endTime: {
        seconds: number;
        milliseconds: number;
    };
};
export declare enum Provider {
    OPENAI = "openai",
    AZURE_OPENAI = "azure-openai",
    ANTHROPIC = "anthropic"
}
export declare class HeliconeAsyncLogger {
    private configurationManager;
    constructor(configurationManager: IHeliconeConfigurationManager);
    log(asyncLogModel: HeliconeAyncLogRequest, provider: Provider): Promise<void>;
    static createTiming(startTime: number, endTime: number): {
        startTime: {
            seconds: number;
            milliseconds: number;
        };
        endTime: {
            seconds: number;
            milliseconds: number;
        };
    };
}
