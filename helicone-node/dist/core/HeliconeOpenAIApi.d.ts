import { OpenAIApi } from "openai";
import { IHeliconeConfigurationManager } from "./IHeliconeConfigurationManager";
export declare class HeliconeOpenAIApi extends OpenAIApi {
    constructor(configurationProvider: IHeliconeConfigurationManager);
}
