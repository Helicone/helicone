#### OpenAI Integration

##### JavaScript/TypeScript (OpenAI v4+)

```javascript
// Before
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// After
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Example usage
const chatCompletion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello world" }],
});
```

##### JavaScript/TypeScript (Legacy OpenAI)

```javascript
// Before
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// After
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: "https://oai.helicone.ai/v1",
  baseOptions: {
    headers: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    },
  },
});

const openai = new OpenAIApi(configuration);

// Example usage
const response = await openai.createChatCompletion({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello world" }],
});
```

##### Python (OpenAI v1+)

```python
# Before
from openai import OpenAI

client = OpenAI(
  api_key="your-api-key-here",
)

# After
from openai import OpenAI

client = OpenAI(
  api_key="your-api-key-here",
  base_url="https://oai.helicone.ai/v1",
  default_headers={
    "Helicone-Auth": f"Bearer {os.environ.get('HELICONE_API_KEY')}",
  }
)

# Example usage
response = client.chat.completions.create(
  model="gpt-4",
  messages=[
    {"role": "user", "content": "Hello world"}
  ]
)
```

##### Python (Package Integration)

```python
# Before
import openai

# After
from helicone.openai_proxy import openai  # replace `import openai` with this line

# Example usage
response = openai.ChatCompletion.create(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "user", "content": "Hello world"}
  ]
)
```
