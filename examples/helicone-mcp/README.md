# Getting Started with Helicone + Claude Agent SDK

Welcome! This guide will get you up and running in **5 minutes**.

## ⚠️ Important: API Keys Required

You need **TWO** API keys:

1. **Helicone API Key** - For observability and gateway access
2. **Anthropic API Key** - Required by Claude Agent SDK

## Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Get API Keys

**Helicone API Key:**
- Go to: https://us.helicone.ai/settings/api-keys
- Click "Create API Key"
- Copy the key (starts with `sk-helicone-`)

**Anthropic API Key:**
- Go to: https://console.anthropic.com/settings/keys
- Click "Create Key"
- Copy the key (starts with `sk-ant-`)

### 3. Set Environment Variables

**Option A: Quick Export (Mac/Linux)**
```bash
export HELICONE_API_KEY="sk-helicone-xxxxxxx"
export ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxx"
```

**Option B: Create .env File (Recommended)**
```bash
cat > .env << 'EOF'
HELICONE_API_KEY=sk-helicone-xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxx
EOF
```

### 4. Run Your First Example

```bash
npm run basic
```

### 5. Check your dashboard

Open your [Helicone dashboard](https://us.helicone.ai) to see your requests and tool calls!

## 🔧 Troubleshooting

### "HELICONE_API_KEY not found"
```bash
# Check if set
echo $HELICONE_API_KEY

# If empty, export it or add it in the .env file
export HELICONE_API_KEY="sk-helicone-xxx"
```

### "ANTHROPIC_API_KEY not found"
```bash
# Check if set
echo $ANTHROPIC_API_KEY

# If empty, export it or add it in the .env file
export ANTHROPIC_API_KEY="sk-ant-xxx"
```

### "Cannot find module '@helicone/mcp'"
```bash
npm install
```

### "MCP server connection failed"
- Verify your HELICONE_API_KEY is valid
- Check you're using the correct key format
- Try running the MCP server directly: `node node_modules/@helicone/mcp/build/index.js`
