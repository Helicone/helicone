import { IHeliconeConfigurationManager } from "./../core/IHeliconeConfigurationManager";
import { OpenAIApi } from "openai";
export declare class HeliconeProxyOpenAIApi extends OpenAIApi {
    constructor(configurationProvider: IHeliconeConfigurationManager);
}
