import { AxiosResponse } from "axios";
import { Configuration } from "openai";

export type OnHeliconeLog = (result: AxiosResponse<any, any>) => Promise<void>;

export interface IHeliconeConfiguration extends Configuration {
  getHeliconeHeaders(): { [key: string]: string };
  getHeliconeAuthHeader(): string;
  getBaseUrl(): string;
  getOnHeliconeLog(): OnHeliconeLog | undefined;
}