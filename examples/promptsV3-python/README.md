# Helicone Prompt Manager - Python Examples

This directory contains Python examples demonstrating how to use the Helicone Prompt Manager to manage and use prompts with LLM providers like OpenAI.

## Setup

1. Create a prompt in the [Helicone Playground](https://us.helicone.ai/playground).
   Ensure this has one variable, `{{hc:name:string}}`, which is required for this example.
   Note the prompt id for the prompt you've created
2. Create a python virtual environment using your venv manager of choice, eg

```bash
uv venv
source .venv/bin/activate
```

3. **Install dependencies**:
   ```bash
   uv pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys and Prompt ID
   ```

5. **Run the example**:

Sync:

```bash
python sync_example.py
```

Async:

```bash
python async_example.py
```