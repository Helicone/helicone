import { AxiosResponse } from "axios";
import { Configuration } from "openai";

export type OnHeliconeLog = (result: AxiosResponse<any, any>) => Promise<void> | undefined;

export interface IHeliconeConfigurationManager {
  resolveConfiguration(): Configuration;
  getHeliconeHeaders(): { [key: string]: string };
  getHeliconeAuthHeader(): string;
  getBasePath(): string;
  getOnHeliconeLog(): OnHeliconeLog;
}