import { IHeliconeConfiguration } from "../core/IHeliconeConfiguration";
import { HeliconeOpenAIApi } from "../core/HeliconeOpenAIApi";

export class HeliconeProxyOpenAIApi extends HeliconeOpenAIApi {
  constructor(heliconeConfiguration: IHeliconeConfiguration) {
    super(heliconeConfiguration);
  }
}
