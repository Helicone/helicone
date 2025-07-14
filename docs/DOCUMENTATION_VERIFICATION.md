# Documentation Verification Guide

Quick validation and testing procedures to ensure documentation accuracy.

## Validation Process

### 1. Find Implementation Files

```bash
# Search for feature-related files
rg -l "feature-name" valhalla/jawn/src/
rg -l "feature-name" --type ts

# Find API controllers
find valhalla/jawn/src/controllers -name "*controller.ts" | xargs grep -l "feature"

# Check managers/services
find valhalla/jawn/src/managers -name "*.ts" | xargs grep -l "feature"
```

### 2. Verify API Endpoints

**Check controller files for:**

- Endpoint paths match documentation
- HTTP methods are correct (GET, POST, PUT, DELETE)
- Request/response structures match
- Authentication requirements

**Quick validation:**

```bash
# Find all API endpoints
rg "@(Get|Post|Put|Delete)" valhalla/jawn/src/controllers/ -A 2

# Check authentication patterns
rg "Helicone-Auth|Authorization" --type ts
```

### 3. Verify Configuration Options

**Check for:**

- All documented options exist in code
- Default values match implementation
- Type information is accurate
- Required vs optional parameters

**Search commands:**

```bash
# Find interfaces and config objects
rg "interface.*Config|type.*Config" valhalla/jawn/src/ -A 10

# Check default values
rg "default.*=|= {" valhalla/jawn/src/ -C 2
```

### 4. Check Headers and Properties

```bash
# Find all Helicone headers
rg "Helicone-[A-Za-z-]+" --type ts -o | sort | uniq

# Check environment variables
rg "process\.env\." valhalla/jawn/src/ | sort | uniq
```

## Testing Process

### 1. Setup Test Environment

```bash
# Create test directory
mkdir test-docs-feature
cd test-docs-feature
npm init -y

# Install dependencies
npm install openai @anthropic-ai/sdk node-fetch

# Set environment variables
export HELICONE_API_KEY="sk-helicone-xxx"
export OPENAI_API_KEY="sk-proj-xxx"
```

### 2. Test Template

```javascript
const OpenAI = require("openai");
const fetch = require("node-fetch");
const crypto = require("crypto");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HELICONE_API_KEY = process.env.HELICONE_API_KEY;

async function testExample() {
  console.log("🧪 Testing documentation example...");

  try {
    // Copy exact code from documentation
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: "https://oai.helicone.ai/v1",
      defaultHeaders: {
        "Helicone-Auth": `Bearer ${HELICONE_API_KEY}`,
      },
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Test message" }],
    });

    // Verify response
    if (response.choices && response.choices[0]) {
      console.log("✅ Test passed");
      return true;
    } else {
      console.log("❌ Unexpected response structure");
      return false;
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return false;
  }
}

testExample();
```

### 3. Test API Endpoints

```javascript
async function testAPIEndpoint() {
  const requestId = crypto.randomUUID();

  // Test the documented API call
  const response = await fetch(
    `https://api.helicone.ai/v1/request/${requestId}/feedback`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HELICONE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rating: true }),
    }
  );

  console.log(`Status: ${response.status}`);
  console.log(`Response: ${await response.text()}`);
}
```

### 4. Test Configuration Options

```javascript
async function testConfigurations() {
  const configs = [
    {
      name: "Basic config",
      headers: { "Helicone-Auth": `Bearer ${HELICONE_API_KEY}` },
    },
    {
      name: "With user ID",
      headers: {
        "Helicone-Auth": `Bearer ${HELICONE_API_KEY}`,
        "Helicone-User-Id": "test-user-123",
      },
    },
  ];

  for (const config of configs) {
    console.log(`Testing: ${config.name}`);
    // Test each configuration...
  }
}
```

## Verification Checklist

### API Accuracy

- [ ] All documented endpoints exist in controllers
- [ ] HTTP methods match implementation
- [ ] Request/response formats are accurate
- [ ] Authentication requirements correct

### Configuration

- [ ] All options documented and exist in code
- [ ] Default values match implementation
- [ ] Type information is correct
- [ ] Required vs optional marked accurately

### Code Examples

- [ ] All imports are valid and current
- [ ] Examples include required setup
- [ ] All code examples tested and working
- [ ] Error handling is appropriate

### Content Quality

- [ ] Follows template structure
- [ ] Uses proper components
- [ ] Focuses on developer use cases
- [ ] No untested code snippets

## Quick Validation Commands

```bash
# Check if endpoints exist
rg "@Post.*feedback" valhalla/jawn/src/controllers/

# Verify header names
rg "Helicone-Auth" --type ts

# Find configuration interfaces
rg "interface.*Config" valhalla/jawn/src/ -A 5

# Check database tables
rg "create table.*feedback" supabase/migrations/

# Find environment variables
rg "process\.env\." valhalla/jawn/src/ | grep -i feature
```

## Common Issues

**Authentication Problems:**

- Check header names match exactly (case-sensitive)
- Verify API key format and validity
- Confirm Bearer token prefix required

**API Mismatches:**

- Endpoint paths don't match controller routes
- Request body structure differs from documentation
- Response format has changed

**Configuration Errors:**

- Default values don't match code
- Missing configuration options
- Incorrect type information

## Fix and Update

After validation/testing:

1. Fix any failing examples with corrected code
2. Add missing configuration options found in code
3. Update authentication details if needed
4. Document any limitations discovered
5. Add error handling for common failure cases

## Maintenance

- Run tests before major releases
- Update when APIs change
- Keep API keys secure and rotate regularly
- Archive test results for reference
