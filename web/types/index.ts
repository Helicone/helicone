export interface IntegrationMethods {
  proxy: "proxy";
  async: "async";
}

export interface Providers {
  openai: "openai";
  anthropic: "anthropic";
}

export type UnionProviderMethods = `${keyof Providers &
  string}-${keyof IntegrationMethods & string}`;
