import { ProviderName } from "@helicone-package/cost/providers/mappings";

export type PlaygroundModel = {
  name: string;
  provider: ProviderName;
};

export type ResponseFormatType = "text" | "json_schema";
export type ResponseFormat = {
  type: ResponseFormatType;
  json_schema?: any;
}

export type VariableInput = {
  isObject: boolean;
  value: string;
}