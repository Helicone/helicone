#!/bin/bash

# Ensure we exit if any command fails
set -e

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js to run this example."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm to run this example."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found."
    echo "Please create a .env file with your API keys."
    echo "Example:"
    echo "HELICONE_API_KEY=your_helicone_api_key"
    echo "GEMINI_API_KEY=your_gemini_api_key"
    echo "USER_ID=test_user_123"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run the example
echo "Running the Gemini with Helicone example..."
npm start 