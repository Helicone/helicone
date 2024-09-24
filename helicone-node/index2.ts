import dotenv from "dotenv";
import { HeliconeManualLogger } from "./async_logger/HeliconeManualLogger";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";

dotenv.config();

const openaiApiKey = "";
const HELICONE_API_KEY = "";

const heliconeLogger = new HeliconeManualLogger({
  apiKey: HELICONE_API_KEY,
});

const openai = new OpenAI({
  apiKey: openaiApiKey,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${HELICONE_API_KEY}`,
  },
});

interface Document {
  id: string;
  content: string;
  embedding: number[];
}

// Mock vector database
const mockVectorDB: Document[] = [
  { id: "1", content: "The capital of France is Paris.", embedding: [] },
  { id: "2", content: "The Eiffel Tower is located in Paris.", embedding: [] },
  {
    id: "3",
    content: "London is the capital of the United Kingdom.",
    embedding: [],
  },
];

async function embedDocument(
  content: string,
  sessionId: string
): Promise<number[]> {
  const res = await openai.embeddings.create(
    {
      model: "text-embedding-ada-002",
      input: content,
    },
    {
      headers: {
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": "/france/embedding",
        "Helicone-Session-Name": "Capital_Finder",
      },
    }
  );

  return res.data[0].embedding;
}

async function mockVectorDBSearch(
  queryEmbedding: number[],
  topK: number = 3,
  sessionId: string
): Promise<Document[]> {
  // Simulate a vector database search
  const reqBody = {
    query_embedding: queryEmbedding,
    top_k: topK,
  };

  // Log the vector database request
  const res = await heliconeLogger.logRequest(
    {
      type: "vector_db",
      operation: "search",
      query: reqBody,
    },
    async (resultRecorder) => {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 100));

      // In a real scenario, we would perform a similarity search here
      // For this mock, we'll just return the first topK documents
      const results = mockVectorDB.slice(0, topK);
      resultRecorder.appendResults(results);
      return results;
    },
    {
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": "/france/embedding",
      "Helicone-Session-Name": "Capital_Finder",
    }
  );

  return res;
}

async function findSimilarDocuments(
  query: string,
  sessionId: string,
  topK: number = 3
): Promise<Document[]> {
  const queryEmbedding = await embedDocument(query, sessionId);
  return mockVectorDBSearch(queryEmbedding, topK, sessionId);
}

async function generateResponse(
  query: string,
  context: string,
  sessionId: string
): Promise<string> {
  const completion = await openai.chat.completions.create(
    {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Use the provided context to answer the user's question.",
        },
        { role: "user", content: `Context: ${context}\n\nQuestion: ${query}` },
      ],
    },
    {
      headers: {
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": "/france/message",
        "Helicone-Session-Name": "Capital_Finder",
      },
    }
  );

  return (
    completion.choices[0].message.content ||
    "Sorry, I couldn't generate a response."
  );
}

async function main() {
  // Example query
  const sessionId = uuidv4();
  const query = "What is the capital of France?";
  console.log("Query:", query);

  // Find similar documents
  const similarDocs = await findSimilarDocuments(query, sessionId);
  const context = similarDocs.map((doc) => doc.content).join(" ");

  // Generate response
  const response = await generateResponse(query, context, sessionId);
  console.log("Response:", response);
}

main().catch(console.error);
