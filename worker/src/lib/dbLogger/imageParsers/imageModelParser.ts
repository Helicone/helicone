/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class ImageModelParser {
  protected modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }
  abstract processMessages(body: any): Record<string, string>;

  protected generateAssetId(): string {
    return crypto.randomUUID();
  }
}
