import { Configuration, ConfigurationParameters } from "openai";
import { IHeliconeConfigurationManager, OnHeliconeLog } from "./IHeliconeConfigurationManager";
import { IHeliconeConfigurationParameters } from "./IHeliconeConfigurationParameters";
export declare class HeliconeAsyncConfigurationManager implements IHeliconeConfigurationManager {
    private heliconeConfigParameters;
    private configurationParameters;
    private heliconeHeaders;
    private basePath;
    private onHeliconeLog?;
    constructor(heliconeConfigParameters: IHeliconeConfigurationParameters, configurationParameters: ConfigurationParameters, basePath?: string, onHeliconeLog?: OnHeliconeLog);
    getOnHeliconeLog(): OnHeliconeLog;
    getHeliconeAuthHeader(): string;
    getBasePath(): string | undefined;
    getHeliconeHeaders(): {
        [key: string]: string;
    };
    resolveConfiguration(): Configuration;
}
