### Helicone Prompts

Helicone Prompts allows you to version, track, and optimize your prompts with variable inputs.

#### When to implement

- **Apply to**: Message content in chat completions or text completions
- **Best for**: Prompts that are reused across the application or contain variable inputs
- **Implementation priority**: Medium - implement after basic Helicone integration is working

#### Integration

1. Install the Helicone Prompts package:

   ```bash
   # JavaScript/TypeScript
   npm install @helicone/prompts

   # Python
   pip install helicone-prompts
   ```

2. Use the `hpf` function to mark variables in your prompts:

   ```javascript
   // JavaScript
   import { hpf } from "@helicone/prompts";

   content: hpf`Write a story about ${{ character }} set in ${{ location }}`;
   ```

   ```python
   # Python
   from helicone_prompts import hpf

   content: hpf("Write a story about {character} set in {location}",
                character=character, location=location)
   ```

   For prompts without variables, use `hpstatic`:

   ```javascript
   // JavaScript
   import { hpstatic } from "@helicone/prompts";

   content: hpstatic`You are a helpful assistant that answers questions.`;
   ```

   ```python
   # Python
   from helicone_prompts import hpstatic

   content: hpstatic("You are a helpful assistant that answers questions.")
   ```

3. Add a prompt ID in your request headers:
   ```
   "Helicone-Prompt-Id": "story_generator"
   ```
