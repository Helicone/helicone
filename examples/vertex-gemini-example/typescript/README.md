# Multi-Provider AI Integration with Helicone

This example demonstrates how to integrate multiple AI providers (Azure OpenAI and Google Gemini/Vertex AI) with Helicone for monitoring and analytics.

## 🚀 What's Included

This example showcases three different integration approaches:

1. **Vercel AI SDK + Azure OpenAI** - Using `@ai-sdk/openai` with Azure configuration
2. **Direct OpenAI Client + Azure OpenAI** - Using the OpenAI SDK directly with Azure
3. **Google Gemini/Vertex AI with Image Support** - Using direct HTTP requests to Vertex AI API with multimodal capabilities

All integrations route through Helicone for comprehensive monitoring and analytics.

## 🖼️ Image Support

The Gemini integration includes automatic image support:

- **Automatically detects** `test.png` in the current directory
- **Multimodal requests**: Combines text prompts with image analysis
- **Base64 encoding**: Converts images to the format required by Vertex AI
- **Fallback support**: Uses text-only requests when no image is present

### Image Requirements

- **Format**: PNG, JPEG, or other common image formats
- **File name**: `test.png` (placed in the same directory as `index.ts`)
- **Size**: Recommended under 10MB for optimal performance

## 📋 Prerequisites

- Node.js 18+ and npm
- An Azure OpenAI account with a deployed model
- (Optional) A Google Cloud Platform account with Vertex AI enabled
- A Helicone account and API key

## 🛠 Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy the `.env` file and update the following values:

   ```bash
   # Azure OpenAI Configuration
   AZURE_API_KEY=your-azure-openai-api-key
   AZURE_OPENAI_API_KEY=your-azure-openai-api-key  # Alternative name
   DEPLOYMENT_NAME=gpt-4o
   ENDPOINT_URL=https://your-resource-name.openai.azure.com/
   API_VERSION=2024-02-15-preview
   RESOURCE_NAME=your-azure-resource-name

   # Helicone Configuration
   HELICONE_API_KEY=your-helicone-api-key

   # Google Cloud / Vertex AI Configuration (Optional)
   GOOGLE_CLOUD_PROJECT=your-gcp-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_API_KEY=your-google-api-key
   VERTEX_AI_TOKEN=your-vertex-ai-token
   ```

## 🔧 Configuration Details

### Azure OpenAI Setup

1. **Get your Azure OpenAI credentials:**
   - Resource name (e.g., `mycompany-openai`)
   - API key from the Azure portal
   - Deployment name (e.g., `gpt-4o`)
   - Endpoint URL (e.g., `https://mycompany-openai.openai.azure.com/`)

2. **Update the configuration:**
   - The example uses `vercelaisdkdocs` as the resource name - replace this with your actual resource name
   - Update the base URL to match your Azure OpenAI endpoint

### Google Cloud Setup (Optional)

1. **Enable Vertex AI API** in your Google Cloud Console
2. **Set up authentication:**
   - For API Key: Create an API key in Google Cloud Console
   - For Service Account: Set up a service account and download the JSON key
3. **Update project settings** in the `.env` file

### Helicone Setup

1. Sign up at [helicone.ai](https://helicone.ai)
2. Get your API key from the dashboard
3. Add it to your `.env` file

## 🏃‍♂️ Running the Example

```bash
npm run start
```

This will run all three examples sequentially:

1. **Vercel AI SDK Example** - Generates a vegetarian lasagna recipe using Azure OpenAI
2. **Google Gemini Example** - Tests Vertex AI integration (shows mock response if not configured)

## 📊 Expected Output

```
🚀 Starting Vercel AI SDK with Azure OpenAI and Helicone...
✅ Vercel AI SDK Response received:
[Generated recipe content...]

📊 Check your Helicone dashboard at https://helicone.ai/requests

==================================================

🚀 Starting Google Gemini with Helicone...
✅ Gemini response (mock):
[Generated recipe content...]

📊 Check your Helicone dashboard at https://helicone.ai/requests
```

## 🔍 Code Structure

### `vercel()` Function
- Uses the Vercel AI SDK (`@ai-sdk/openai`) with `createOpenAI()`
- Configures Azure OpenAI through Helicone's proxy
- Handles API versioning with custom fetch function

### `geminiTest()` Function
- Makes direct HTTP requests to Vertex AI API
- Routes through Helicone's gateway for monitoring
- **Automatic image detection**: Checks for `test.png` and includes it in multimodal requests
- **Dynamic content creation**: Switches between text-only and text+image requests
- Includes comprehensive error handling and setup instructions
- Shows mock response when Google Cloud isn't configured

### `notVercel()` Function
- Uses the OpenAI SDK directly with Azure configuration
- Alternative approach for those preferring the OpenAI client

## 🔧 Troubleshooting

### Azure OpenAI Issues

**404 Errors:**
- Verify your deployment name matches the one in Azure
- Check that your resource name is correct
- Ensure the API version is supported

**Authentication Errors:**
- Verify your API key is correct
- Check that your Azure resource has the necessary permissions

### Google Gemini Issues

**Authentication Errors:**
- Ensure Vertex AI API is enabled in your Google Cloud project
- Verify your API key or service account has the necessary permissions
- Check that your project ID is correct

**URL Errors:**
- Verify the region/location is correct (e.g., `us-central1`)
- Ensure the model name is available in your region

## 📈 Monitoring with Helicone

After running the examples, check your [Helicone dashboard](https://helicone.ai/requests) to see:

- Request logs and responses
- Performance metrics
- Cost tracking
- Error rates and debugging information

## 🛠 Customization

### Adding Different Images

To use different images with the Gemini example:

1. **Replace `test.png`** with your own image file
2. **Update the file path** in the code if using a different name:
   ```typescript
   const imagePath = path.join(__dirname, "your-image.png");
   ```
3. **Modify the prompt** to ask specific questions about your image:
   ```typescript
   text: "What ingredients do you see in this food image? Suggest a recipe."
   ```

### Advanced Image Support

The current implementation can be extended to support:

```typescript
// Multiple image formats
const supportedFormats = ['.png', '.jpg', '.jpeg', '.webp'];
const imageFiles = fs.readdirSync(__dirname)
  .filter(file => supportedFormats.some(format => file.endsWith(format)));

// Different MIME types
const getMimeType = (filename: string) => {
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.webp')) return 'image/webp';
  return 'image/png';
};

// Multiple images in one request
const requestContents = [{
  parts: [
    { text: "Compare these images and describe the differences:" },
    { inlineData: { data: image1Base64, mimeType: "image/png" } },
    { inlineData: { data: image2Base64, mimeType: "image/jpeg" } }
  ]
}];
```

### Using Different Models

Update the model names in the requests:
- For Azure OpenAI: Change the deployment name in the URL
- For Gemini: Change `gemini-1.5-flash` to other available models:
  - `gemini-1.5-pro` (more capable, slower)
  - `gemini-1.0-pro-vision` (legacy vision model)

## 📚 Additional Resources

- [Helicone Documentation](https://docs.helicone.ai/)
- [Azure OpenAI Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/)

## 🤝 Contributing

Feel free to submit issues and enhancement requests! 