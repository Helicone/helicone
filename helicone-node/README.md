# Helicone OpenAI Node.js Library

This package is a simple and convenient way to log all requests made through the OpenAI API with Helicone, with just a one-line code change. By using the Helicone OpenAI Node.js wrapper, you can easily track and manage your OpenAI API usage and monitor your GPT models' cost, latency, and performance on the Helicone platform.

## Installation

To install the Helicone OpenAI Node.js library, simply run the following command:

```bash
npm install helicone-openai
```

## Usage
You need to have an API key from Helicone. Once you have the API key, set it as an environment variable HELICONE_API_KEY.

```bash
export HELICONE_API_KEY=your_helicone_api_key_here
```

Then, in your JavaScript or TypeScript code, replace your existing OpenAI library imports with Helicone's wrapper:

```javascript
const { Configuration, OpenAIApi } = require("helicone-openai"); // replace `require("openai")` with this line
```

## Requirements
- Node.js version 12 or higher is required.
