import { Configuration, ConfigurationParameters } from "openai";
import { IHeliconeConfigurationManager as IHeliconeConfigurationManager, OnHeliconeLog } from "./IHeliconeConfigurationManager";
import { IHeliconeConfigurationParameters } from "./IHeliconeConfigurationParameters";
export declare class HeliconeProxyConfigurationManager implements IHeliconeConfigurationManager {
    private heliconeConfigParameters;
    private configurationParameters;
    private heliconeHeaders;
    private basePath;
    constructor(heliconeConfigParameters: IHeliconeConfigurationParameters, configurationParameters: ConfigurationParameters, basePath?: string);
    getOnHeliconeLog(): OnHeliconeLog;
    getBasePath(): string | undefined;
    getHeliconeAuthHeader(): string;
    getHeliconeHeaders(): {
        [key: string]: string;
    };
    resolveConfiguration(): Configuration;
}
