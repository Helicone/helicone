#!/bin/bash

# Exit on error
set -e

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the example
echo "Running Gemini Async with Manual Logging example..."
python example.py

# Deactivate virtual environment
deactivate

echo "Example completed successfully!" 