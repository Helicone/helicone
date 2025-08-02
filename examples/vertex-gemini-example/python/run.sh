#!/bin/bash

# Exit on error
set -e

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if Google Cloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "Google Cloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated with Google Cloud
echo "Checking Google Cloud authentication..."
if ! gcloud auth application-default print-access-token &> /dev/null; then
    echo "Authenticating with Google Cloud..."
    gcloud auth application-default login
fi

# Run the example
echo "Running the example..."
python gemini_example.py

# Deactivate virtual environment
deactivate

echo "Done!" 