#!/bin/bash

# Script to generate prompt.md from base_prompt.md, task.md, and optional keys.md
# This combines all the pieces into a single prompt file for Claude Code

set -e  # Exit on error

# File paths
BASE_PROMPT="./src/base_prompt.md"
TASK_FILE="./src/task.md"
KEYS_FILE="./private/keys.md"
OUTPUT_FILE="./prompt.md"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================"
echo "Generating Claude Code Agent Prompt"
echo "========================================"
echo ""

# Check if required files exist
if [ ! -f "$BASE_PROMPT" ]; then
  echo -e "${RED}Error: $BASE_PROMPT not found${NC}"
  exit 1
fi

if [ ! -f "$TASK_FILE" ]; then
  echo -e "${RED}Error: $TASK_FILE not found${NC}"
  exit 1
fi

# Start generating the prompt
echo "Combining files..."
echo "  - $BASE_PROMPT"
echo "  - $TASK_FILE"

# Create the prompt file with base and task
cat "$BASE_PROMPT" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
cat "$TASK_FILE" >> "$OUTPUT_FILE"

# Add keys if they exist
if [ -f "$KEYS_FILE" ]; then
  echo "  - $KEYS_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "---" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  cat "$KEYS_FILE" >> "$OUTPUT_FILE"
else
  echo -e "${YELLOW}  - Warning: $KEYS_FILE not found (optional)${NC}"
fi

echo ""
echo -e "${GREEN}✓ Generated $OUTPUT_FILE${NC}"
echo ""

# Show preview option
if [ "$1" == "--preview" ] || [ "$1" == "-p" ]; then
  echo "========================================"
  echo "Prompt Preview:"
  echo "========================================"
  cat "$OUTPUT_FILE"
  echo ""
  echo "========================================"
fi

# Show stats
LINE_COUNT=$(wc -l < "$OUTPUT_FILE")
WORD_COUNT=$(wc -w < "$OUTPUT_FILE")
echo "Stats: $LINE_COUNT lines, $WORD_COUNT words"
echo ""
