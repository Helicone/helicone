const { Configuration, OpenAIApi } = require("openai");

class Helicone {
  constructor() {
    this.heliconeApiKey = process.env.HELICONE_API_KEY;
    if (!this.heliconeApiKey) {
      throw new Error(
        "Helicone API key is not set as an environment variable."
      );
    }
  }

  getOpenAIApi(configuration) {
    const heliconeHeaders = {
      "Helicone-Auth": `Bearer ${this.heliconeApiKey}`,
    };

    const mergedHeaders = {
      ...configuration.headers,
      ...heliconeHeaders,
    };

    const basePath = "https://oai.hconeai.com/v1";
    const mergedConfiguration = new Configuration({
      ...configuration,
      basePath,
      headers: mergedHeaders,
    });

    return new OpenAIApi(mergedConfiguration);
  }
}

const heliconeInstance = new Helicone();

function HeliconeOpenAIApi(configuration) {
  return heliconeInstance.getOpenAIApi(configuration);
}

module.exports = {
  Configuration: Configuration,
  OpenAIApi: HeliconeOpenAIApi,
};
