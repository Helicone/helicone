#!/usr/bin/env node

/**
 * Test script for OpenAI Responses API through Helicone proxy
 * This script tests if output_text is correctly rendered
 */

const https = require('https');
const http = require('http');

// Test configuration
const HELICONE_PROXY_URL = 'http://localhost:8787';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-key';

// Simple test request using the Responses API format
const requestData = {
  model: 'gpt-4',
  input: [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: 'What is the capital of France?'
        }
      ]
    }
  ]
};

// Mock response for local testing (since we might not have a real API key)
const mockResponse = {
  id: 'resp-test-123',
  object: 'response',
  created: Date.now(),
  model: 'gpt-4',
  output: [
    {
      type: 'message',
      id: 'msg-001',
      role: 'assistant',
      content: [
        {
          type: 'output_text',
          text: 'The capital of France is Paris. It is located in the north-central part of the country.'
        }
      ]
    }
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30
  }
};

function makeRequest() {
  const postData = JSON.stringify(requestData);

  const options = {
    hostname: 'localhost',
    port: 8787,
    path: '/v1/response',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Helicone-Auth': 'Bearer sk-helicone-test-key'
    }
  };

  console.log('Sending request to Helicone proxy...');
  console.log('Request data:', JSON.stringify(requestData, null, 2));

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\nResponse status:', res.statusCode);
      console.log('Response headers:', res.headers);
      console.log('\nResponse body:', data);

      try {
        const jsonData = JSON.parse(data);
        console.log('\nParsed response:', JSON.stringify(jsonData, null, 2));

        // Check if output_text is present
        if (jsonData.output && Array.isArray(jsonData.output)) {
          const hasOutputText = jsonData.output.some(item =>
            item.content && Array.isArray(item.content) &&
            item.content.some(c => c.type === 'output_text')
          );
          console.log('\nHas output_text:', hasOutputText);
        }
      } catch (e) {
        console.error('Error parsing response:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.write(postData);
  req.end();
}

// For local testing, let's also create a mock data file to understand the structure
function createMockData() {
  const fs = require('fs');
  const mockRequestResponse = {
    request: {
      model: 'gpt-4',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Explain quantum computing in simple terms'
            }
          ]
        }
      ]
    },
    response: {
      id: 'resp-mock-456',
      object: 'response',
      created: Date.now(),
      model: 'gpt-4',
      output: [
        {
          type: 'message',
          id: 'msg-mock-001',
          role: 'assistant',
          content: [
            {
              type: 'output_text',
              text: 'Quantum computing is a type of computing that uses quantum-mechanical phenomena, such as superposition and entanglement, to perform operations on data. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits or qubits, which can exist in multiple states simultaneously.'
            }
          ]
        }
      ],
      usage: {
        prompt_tokens: 15,
        completion_tokens: 45,
        total_tokens: 60
      }
    }
  };

  fs.writeFileSync(
    '/tmp/mock-responses-api-data.json',
    JSON.stringify(mockRequestResponse, null, 2)
  );

  console.log('Mock data written to /tmp/mock-responses-api-data.json');
}

// Run the test
if (process.argv.includes('--mock-only')) {
  createMockData();
} else {
  createMockData();
  makeRequest();
}
