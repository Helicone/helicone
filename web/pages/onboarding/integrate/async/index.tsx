"use client";

import {
  CodeIntegrationPage,
  CodeSnippet,
} from "@/components/onboarding/CodeIntegrationPage";

const CODE_SNIPPETS: CodeSnippet = {
  openai_async: {
    formattedName: "OpenAI",
    typescript: (
      key: string
    ) => `import { HeliconeAsyncLogger } from "@helicone/async";
import OpenAI from "openai";

const logger = new HeliconeAsyncLogger({
  apiKey: "${key}",
  providers: {
    openAI: OpenAI
  }
});
logger.init();

const openai = new OpenAI();`,
    python: (key: string) => `from helicone_async import HeliconeAsyncLogger
from openai import OpenAI

logger = HeliconeAsyncLogger(
    api_key="${key}",
    providers={
        "openAI": OpenAI
    }
)
logger.init()

client = OpenAI()`,
    docsLink:
      "https://docs.helicone.ai/getting-started/integration/openllmetry",
  },
  anthropic_async: {
    formattedName: "Anthropic",
    typescript: (
      key: string
    ) => `import { HeliconeAsyncLogger } from "@helicone/async";
import Anthropic from "@anthropic-ai/sdk";

const logger = new HeliconeAsyncLogger({
  apiKey: "${key}",
  providers: {
    anthropic: Anthropic
  }
});
logger.init();

const anthropic = new Anthropic();`,
    python: (key: string) => `from helicone_async import HeliconeAsyncLogger
from anthropic import Anthropic

logger = HeliconeAsyncLogger(
    api_key="${key}",
    providers={
        "anthropic": Anthropic
    }
)
logger.init()

client = Anthropic()`,
    docsLink:
      "https://docs.helicone.ai/getting-started/integration/openllmetry",
  },
  azure_async: {
    formattedName: "Azure OpenAI",
    typescript: (
      key: string
    ) => `import { HeliconeAsyncLogger } from "@helicone/async";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

const logger = new HeliconeAsyncLogger({
  apiKey: "${key}",
  providers: {
    azureOpenAI: OpenAIClient
  }
});
logger.init();

const client = new OpenAIClient(
  "https://{{RESOURCE_NAME}}.openai.azure.com",
  new AzureKeyCredential("{{AZURE_API_KEY}}"),
);`,
    python: (key: string) => `from helicone_async import HeliconeAsyncLogger
from openai import AzureOpenAI

logger = HeliconeAsyncLogger(
    api_key="${key}",
    providers={
        "azureOpenAI": AzureOpenAI
    }
)
logger.init()

client = AzureOpenAI(
    api_key="{{AZURE_API_KEY}}",
    api_version="{{API_VERSION}}",
    azure_endpoint="https://{{RESOURCE_NAME}}.openai.azure.com"
)`,
    docsLink:
      "https://docs.helicone.ai/getting-started/integration/openllmetry",
  },
  openllmetry_other: {
    formattedName: "Additional Providers",
    typescript: (
      key: string
    ) => `import { HeliconeAsyncLogger } from "@helicone/async";
// Import your preferred providers
import { CohereClient } from "cohere-ai";
import { BedrockClient } from "@aws-sdk/client-bedrock-runtime";
import { GoogleGenerativeAI } from "@google/generative-ai";

const logger = new HeliconeAsyncLogger({
  apiKey: "${key}",
  providers: {
    // Configure any combination of supported providers:
    cohere: CohereClient,
    bedrock: BedrockClient,
    googleAI: GoogleGenerativeAI,
    // Supports: Cohere, Bedrock, Google AI, and more
  }
});
logger.init();`,
    python: (key: string) => `from helicone_async import HeliconeAsyncLogger
# Import your preferred providers
import cohere
from anthropic import Anthropic
import google.generativeai

logger = HeliconeAsyncLogger(
    api_key="${key}",
    providers={
        # Configure any combination of supported providers:
        "cohere": cohere.Client,
        "bedrock": "BedrockClient",
        "googleAI": google.generativeai,
        # Supports: Cohere, Bedrock, Google AI, and more
    }
)
logger.init()`,
    docsLink:
      "https://docs.helicone.ai/getting-started/integration/openllmetry",
  },
  custom_model: {
    formattedName: "Custom Model",
    typescript: (
      key: string
    ) => `import { HeliconeManualLogger } from "@helicone/helpers";

// Initialize with your Helicone API key
const logger = new HeliconeManualLogger({
  apiKey: "${key}"
});

// Example request to your custom model
const customRequest = {
  model: "your-model-name",
  messages: [{ role: "user", content: "Hello!" }]
};

// Log the request and response
const response = await logger.logRequest(
  customRequest,
  async (recorder) => {
    const result = await fetch("YOUR_MODEL_ENDPOINT", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_MODEL_KEY"
      },
      body: JSON.stringify(customRequest)
    });
    
    const data = await result.json();
    recorder.appendResults(data); // Capture response
    return data;
  }
);`,
    python: (key: string) => `from helicone_helpers import HeliconeManualLogger
import requests
import json

# Initialize with your Helicone API key
logger = HeliconeManualLogger(api_key="${key}")

def custom_operation(recorder):
    # Make request to your model endpoint
    response = requests.post(
        "YOUR_MODEL_ENDPOINT",
        headers={
            "Authorization": "Bearer YOUR_MODEL_KEY",
            "Content-Type": "application/json"
        },
        json=recorder.request
    )
    
    # Record response details
    recorder.append_results({
        "status": response.status_code,
        "headers": dict(response.headers),
        "body": response.json()
    })
    return response.json()

# Execute with logging
result = logger.log_request(
    provider="custom",  # Explicit custom provider
    request={
        "model": "your-model-name",
        "messages": [{"role": "user", "content": "Hello!"}]
    },
    operation=custom_operation,
    additional_headers={
        "Helicone-Session-Id": "session-123"  # Optional tracking
    }
)`,
    curl: (key: string) => `# Direct API logging example
curl -X POST https://api.us.hconeai.com/custom/v1/log \\
  -H 'Authorization: Bearer ${key}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "providerRequest": {
      "url": "custom-model-nopath",
      "json": {
        "model": "your-model-name",
        "messages": [{"role": "user", "content": "Hello!"}]
      },
      "meta": {
        "environment": "production"
      }
    },
    "providerResponse": {
      "json": {
        "choices": [{"message": {"content": "Hello there!"}}]
      },
      "status": 200,
      "headers": {
        "content-type": "application/json"
      }
    },
    "timing": {
      "startTime": {
        "seconds": ${Math.floor(Date.now() / 1000) - 10},
        "milliseconds": 0
      },
      "endTime": {
        "seconds": ${Math.floor(Date.now() / 1000)},
        "milliseconds": 500
      }
    }
  }'`,
    docsLink:
      "https://docs.helicone.ai/getting-started/integration-method/custom",
  },
};

export default function AsyncPage() {
  return (
    <CodeIntegrationPage
      title="Send an event via Async Logging"
      description="All async logging is powered by OpenLLMetry. Select your provider to get started."
      codeSnippets={CODE_SNIPPETS}
      languages={["typescript", "python", "curl"]}
      defaultProvider="openai_async"
      defaultLanguage="typescript"
    />
  );
}
