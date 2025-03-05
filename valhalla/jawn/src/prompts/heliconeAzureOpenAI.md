#### Azure OpenAI Integration

<Info>
When using Azure, the model displays differently than expected at times. We highly recommend using model override:
`Helicone-Model-Override: [MODEL_NAME]`
</Info>

##### JavaScript/TypeScript

```javascript
// Before
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `https://${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": "2023-05-15" },
});

// After (AzureOpenAI)
import { AzureOpenAI } from "openai";

const azureOpenai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_API_VERSION,
  baseURL: `https://oai.helicone.ai/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`,
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-OpenAI-API-Base": `https://${process.env.AZURE_DOMAIN}.openai.azure.com`,
    "api-key": process.env.AZURE_OPENAI_API_KEY,
  },
});

// Alternative (OpenAI v4+)
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: `https://oai.helicone.ai/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`,
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-OpenAI-API-Base": `https://${process.env.AZURE_DOMAIN}.openai.azure.com`,
    "api-key": process.env.AZURE_OPENAI_API_KEY,
  },
  defaultQuery: { "api-version": process.env.AZURE_API_VERSION },
});
```

##### Python

```python
# Before
from openai import AzureOpenAI

client = AzureOpenAI(
  api_key=os.getenv("AZURE_OPENAI_API_KEY"),
  azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
  api_version="2023-05-15"
)

# After (OpenAI v1+)
from openai import OpenAI

client = OpenAI(
  api_key=os.getenv("AZURE_OPENAI_API_KEY"),
  base_url=f"https://oai.helicone.ai/openai/deployments/{os.getenv('AZURE_DEPLOYMENT_NAME')}",
  default_headers={
    "Helicone-OpenAI-Api-Base": f"https://{os.getenv('AZURE_DOMAIN')}.openai.azure.com",
    "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}",
    "api-key": os.getenv("AZURE_OPENAI_API_KEY"),
  },
  default_query={
    "api-version": os.getenv("AZURE_API_VERSION")
  }
)
```

##### LangChain (JavaScript/TypeScript)

```javascript
// Before
const model = new ChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiDeploymentName: "openai/deployments/gpt-35-turbo",
  azureOpenAIApiVersion: "2023-03-15-preview",
  azureOpenAIBasePath: `https://${process.env.AZURE_DOMAIN}.openai.azure.com`,
});

// After
const model = new ChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiDeploymentName: "openai/deployments/gpt-35-turbo",
  azureOpenAIApiVersion: "2023-03-15-preview",
  azureOpenAIBasePath: "https://oai.helicone.ai",
  configuration: {
    baseOptions: {
      headers: {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
        "Helicone-OpenAI-Api-Base": `https://${process.env.AZURE_DOMAIN}.openai.azure.com`,
      },
    },
  },
});
```

##### LangChain (Python)

```python
# Before
from langchain.chat_models import AzureChatOpenAI

model = AzureChatOpenAI(
  openai_api_base=f"https://{azure_domain}.openai.azure.com",
  deployment_name="gpt-35-turbo",
  openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
  openai_api_version="2023-05-15",
  openai_api_type="azure",
)

# After
from langchain.chat_models import AzureChatOpenAI

helicone_headers = {
  "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}",
  "Helicone-OpenAI-Api-Base": f"https://{azure_domain}.openai.azure.com"
}

model = AzureChatOpenAI(
  openai_api_base="https://oai.helicone.ai",
  deployment_name="gpt-35-turbo",
  openai_api_key=os.getenv("AZURE_OPENAI_API_KEY"),
  openai_api_version="2023-05-15",
  openai_api_type="azure",
  headers=helicone_headers,
)
```

##### cURL

```bash
# Before
curl --request POST \
  --url https://${AZURE_DOMAIN}.openai.azure.com/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION} \
  --header "api-key: ${AZURE_API_KEY}" \
  --header "content-type: application/json" \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Hello world"
      }
    ]
  }'

# After
curl --request POST \
  --url https://oai.helicone.ai/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION} \
  --header "Helicone-Auth: Bearer ${HELICONE_API_KEY}" \
  --header "Helicone-OpenAI-Api-Base: https://${AZURE_DOMAIN}.openai.azure.com" \
  --header "api-key: ${AZURE_API_KEY}" \
  --header "content-type: application/json" \
  --data '{
    "messages": [
      {
        "role": "user",
        "content": "Hello world"
      }
    ]
  }'
```
