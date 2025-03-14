# Instructions

# Instructions

You will systematically verify and improve the integration documentation for Helicone.ai by going through each doc, executing the code examples, and ensuring they return valid responses. You'll also standardize the format across all documentation.

## MAIN RULE: REVIEW INSTRUCTIONS BEFORE EACH STEP

CRITICAL: Before beginning each new step or document, you MUST review these instructions in full and reiterate the relevant parts to yourself. This ensures you're following the correct process every time. At the start of each new document or major step, explicitly state:

1. What document/integration you're working on
2. What step of the process you're at
3. The specific instructions you're following for this step
4. Your plan to implement these instructions

This practice helps maintain consistency and ensures no important steps are missed. Do not skip this review process.

# Part 1: Navigation and Evaluation Process

1. Start by exploring the documentation structure:
   - List all directories in the docs directory
   - Identify all integration directories (e.g., integrations/, other-integrations/, etc.)
2. For each integration category, process the files methodically:
   - Start with major integrations (OpenAI, Anthropic, Azure, etc.)
   - Process one file at a time in alphabetical order within each integration category
3. After completing integrations, review other documentation categories:
   - Getting started guides
   - Feature documentation
   - References
   - FAQs

# Part 2: Individual Document Review Process

## General Rules & Troubleshooting

- If you're stuck or unsure about any integration, research it online
- Check official provider documentation (OpenAI, Anthropic, etc.) for latest API specifications
- If you encounter errors, search for solutions on GitHub, Stack Overflow, or provider forums
- When troubleshooting, try minimal working examples before complex implementations
- If still stuck after research, ask for specific guidance
- Document all issues encountered and their solutions for future reference

For each document, follow these steps:

1. Initial Review:

   - Read the entire document to understand its purpose and content
   - Identify all code examples and their programming language
   - Research on the internet the latest integrations to see if the documentation is up to date

2. Code Example Verification and Testing:
   Follow these steps in order:

   a. Extract code examples

   - Identify and extract each code example from the document
   - Note their programming language and purpose

   b. Create test environment

   - Create a new folder in the testing directory for this specific test
     - Use a descriptive name like `testing/integration_openai_python` or `testing/bedrock_js`
     - Include provider name, language, and other relevant identifiers in the folder name
   - Create all test files within this specific folder to ensure isolation
   - For Python: Create a .py file named after the integration (e.g., `test.py`)
   - For JavaScript: Create a .js file (e.g., `test.js`)
   - For other languages: Create appropriate files
   - Copy the .env file from the testing directory to this new folder or use relative paths to access it

   c. Set up API keys

   - Check if the testing/.env file has REAL API keys for the service you're testing
   - IMPORTANT: DO NOT use placeholder or fake API keys - they must be real and valid
   - If API keys are missing or appear to be fake/placeholders:
     - Explicitly ask the user for real API keys for the specific service
     - Request the needed keys with clear names (e.g., "I need a valid OPENAI_API_KEY to test this integration")
     - Wait for the user to provide the keys before proceeding
   - Once you have valid keys, load them properly:
     - For Python: Use python-dotenv
     - For JavaScript: Use dotenv
   - If an integration requires additional configuration beyond API keys, request that information as well

   d. Implement Helicone integration

   - IMPORTANT: ALL examples MUST use Helicone and include the Helicone-Auth header
   - Set up Helicone integration headers at initialization:
     - Add the `Helicone-Auth` header with Bearer token
     - Add `Helicone-Property-Integration` header to track integration method
   - Add per-request Helicone headers:
     - Include `Helicone-User-Id` header for individual requests
   - Make a reasonable effort to add headers, but if a particular integration doesn't support headers, don't get stuck - document the limitation and proceed
   - Ensure proper authentication is set up
   - Use either proxy integration or package integration as appropriate

   e. Execute and test

   - Run the code example with minimal modifications
   - Capture the full response
   - Verify the response is valid in TWO ways:
     1. LLM validation: Analyze the response structure for expected fields and absence of errors
     2. Documentation reference: Research the provider's documentation to confirm the expected response format
   - Compare the actual response with the expected format from provider documentation
   - For good examples, save the response format (sanitized of sensitive data)
   - For failing examples, identify the issue (authentication, syntax, deprecated API, etc.)
   - If response format is unclear, check GitHub repos with similar integrations as references

   f. Document results

   - Integration/file name
   - Code example tested
   - Pass/Fail status
   - Response (success or error message)
   - If failed, try to fix the code example

# Part 3: Code Snippet Improvements and Standardization

Focus ONLY on improving code snippets in the documentation while following these standardization guidelines:

## Fixing and Updating Code

1. Fix Invalid Code:

   - Update code snippets with current API specifications
   - Ensure all code examples execute successfully
   - Fix any syntax errors or deprecated methods
   - Make sure code matches the surrounding text description
   - If text says one version but code is for another, update appropriately

2. Version Management:

   - When adding a new API version, KEEP the old version too
   - Use Code Groups (see formatting below) to present multiple versions side by side
   - Clearly label each version (e.g., "OpenAI v1", "OpenAI v2")

3. Helicone Integration:
   - For proxy integrations: Always show base_url and Helicone-Auth header
   - For package integrations: Show installation and import process
   - Include both sync and async examples where applicable
   - For JavaScript/TypeScript: Include both Node.js and browser examples where relevant

## Documentation Validation

4. Test Changes with Mintlify:
   - After making changes to any documentation file, run mintlify dev to verify it still builds correctly
   - Command: `npx mintlify dev`
   - Verify the development server starts without errors
   - Check the modified pages to ensure they render correctly
   - If errors occur, fix them before proceeding to the next document
   - Document any build issues encountered and how they were resolved

## Code Style Standardization

5. Style Guidelines:

   - Use consistent style across all examples of the same language
   - Use double quotes for strings in all languages (except where single quotes are required)
   - Add proper spacing around operators (e.g., `a = b`, not `a=b`)
   - Use consistent indentation (2 spaces for JavaScript/TypeScript, 4 spaces for Python)
   - End statements with semicolons in JavaScript/TypeScript
   - Include blank lines between logical sections of code
   - Do not include comments in the code examples

6. Variable Naming:

   - Use descriptive variable names that explain their purpose
   - Client variables should be consistently named:
     - Python: `client` or `openai_client`, `anthropic_client`, etc.
     - JavaScript: `client` or `openaiClient`, `anthropicClient`, etc.
   - Use camelCase for JavaScript/TypeScript variables
   - Use snake_case for Python variables
   - For response variables, use descriptive names:
     - Python: `response`, `completion_response`, `embedding_result`, etc.
     - JavaScript: `response`, `completionResponse`, `embeddingResult`, etc.

7. API Key Handling:
   - Never hardcode actual API keys in examples (use environment variables)
   - Show loading API keys from environment variables:
     - Python: `os.environ.get("OPENAI_API_KEY")`
     - JavaScript: `process.env.OPENAI_API_KEY`
   - For Helicone API keys, always use `HELICONE_API_KEY` environment variable
   - When showing Auth headers, use this format:
     - `"Helicone-Auth": "Bearer ${HELICONE_API_KEY}"`

## Mintlify Formatting

8. Code Blocks:

   - Every code example must use proper Mintlify code blocks with language specified
   - Always include a descriptive title or version label after the language
   - Example: ```python Python SDK Example

9. Code Groups:

   - Use Code Groups when showing multiple languages or versions
   - Example:
     <CodeGroup>
     ```javascript JavaScript
     console.log("Hello World");
     ```
     ```python Python
     print("Hello World")
     ```
     </CodeGroup>

10. Advanced Formatting:

- Use expandable code blocks for long examples: [expandable]
- Use line highlighting for important sections: {1,3-5}

## Example Structure Templates

Use these templates to ensure consistency:

### Python Template (OpenAI):

```python
import os
import openai
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
HELICONE_API_KEY = os.environ.get("HELICONE_API_KEY")

client = openai.OpenAI(
    api_key=OPENAI_API_KEY,
    base_url="https://oai.helicone.ai/v1",
    default_headers={
        "Helicone-Auth": f"Bearer {HELICONE_API_KEY}",
        "Helicone-Property-Integration": "python-sdk"
    }
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, how are you?"}
    ],
    extra_headers={
        "Helicone-User-Id": "user@example.com"
    }
)

print(response.choices[0].message.content)
```

### JavaScript Template (OpenAI):

```javascript
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HELICONE_API_KEY = process.env.HELICONE_API_KEY;

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${HELICONE_API_KEY}`,
    "Helicone-Property-Integration": "javascript-sdk",
  },
});

async function main() {
  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello, how are you?" },
    ],
    headers: {
      "Helicone-User-Id": "user@example.com",
    },
  });

  console.log(response.choices[0].message.content);
}

main();
```
