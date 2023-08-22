import { AxiosResponse } from "axios";
import { Configuration } from "openai";

export type OnHeliconeLog = (result: AxiosResponse<any, any>) => Promise<void>;
export type OnHeliconeFeedback = (result: Response) => Promise<void>;

export interface IHeliconeConfiguration extends Configuration {
  getHeliconeHeaders(): { [key: string]: string };
  getHeliconeAuthHeader(): string;
  getBaseUrl(): URL;
  getOnHeliconeLog(): OnHeliconeLog | undefined;
  getOnHeliconeFeedback(): OnHeliconeFeedback | undefined;
}
