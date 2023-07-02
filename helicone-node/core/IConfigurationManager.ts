import { Configuration } from "openai";

export interface IConfigurationManager {
  resolveConfiguration(): Configuration;
  getHeliconeHeaders(): { [key: string]: string };
  getHeliconeAuthHeader(): string;
  getBasePath(): string;
}
