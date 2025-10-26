#!/bin/bash

# Configuration
SLEEP_TIME_SECONDS=0    # Time to sleep between iterations (in seconds) - default: 60 (1 minute)
DONE_FILE="./.agent/DONE.md"  # File to check for completion
PROMPT_FILE="./prompt.md"  # Generated prompt file

# Ensure .agent directory exists
mkdir -p ./.agent

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Error handling
set -e
trap 'echo -e "\n${YELLOW}Agent loop interrupted. Cleaning up...${NC}"; exit 0' INT TERM

# Generate the prompt from source files
echo -e "${GREEN}Generating prompt from source files...${NC}"
./generate-prompt.sh
if [ ! -f "$PROMPT_FILE" ]; then
  echo -e "${RED}Error: Failed to generate $PROMPT_FILE${NC}"
  exit 1
fi
echo ""

# Run Claude Code agent loop until DONE.md file is created

# Remove the DONE file if it exists from a previous run
if [ -f "$DONE_FILE" ]; then
  rm "$DONE_FILE"
  echo "Removed existing $DONE_FILE from previous run"
fi

ITERATION=0
START_TIME=$(date +%s)

echo "========================================"
echo "Starting Claude Code Agent Loop"
echo "Start time: $(date)"
echo "Will run until $DONE_FILE is created"
echo "========================================"
echo ""

while [ ! -f "$DONE_FILE" ]; do
  ITERATION=$((ITERATION + 1))

  echo "========================================"
  echo "Iteration #$ITERATION at $(date)"
  echo "========================================"

  # Run Claude Code with the prompt
  if [ $ITERATION -eq 1 ]; then
    # First iteration: start fresh without --continue
    cat "$PROMPT_FILE" | claude -p --dangerously-skip-permissions
  else
    # Subsequent iterations: use --continue
    cat "$PROMPT_FILE" | claude -p --dangerously-skip-permissions --continue
  fi

  # Check if DONE file was created
  if [ -f "$DONE_FILE" ]; then
    echo ""
    echo "DONE file detected. Exiting loop."
    break
  fi

  # Sleep before next iteration
  if [ $SLEEP_TIME_SECONDS -gt 0 ]; then
    echo ""
    echo "Sleeping for $SLEEP_TIME_SECONDS seconds..."
    sleep $SLEEP_TIME_SECONDS
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    echo "Elapsed time: $((ELAPSED / 60)) minutes"
    echo ""
  fi
done

echo ""
echo "========================================"
echo "Agent Loop Complete"
echo "End time: $(date)"
echo "Total iterations: $ITERATION"
ELAPSED=$(($(date +%s) - START_TIME))
echo "Total elapsed time: $((ELAPSED / 60)) minutes $((ELAPSED % 60)) seconds"
echo "========================================"
