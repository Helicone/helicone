#!/bin/bash

# Exit on error
set -e

# Default values
CUSTOM_TAG=""
TEST_MODE=false
DONT_PRUNE=false
SELECTED_IMAGES=()

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--test)
      TEST_MODE=true
      shift
      ;;
    --dont-prune)
      DONT_PRUNE=true
      shift
      ;;
    -c|--custom-tag)
      CUSTOM_TAG="$2"
      shift 2
      ;;
    -i|--image)
      SELECTED_IMAGES+=("$2")
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Generate version tag
VERSION_TAG="v$(date +'%Y.%m.%d')"
if [ ! -z "$CUSTOM_TAG" ]; then
  VERSION_TAG="${VERSION_TAG}-${CUSTOM_TAG}"
fi

# Function to run commands in test mode or normal mode
run_command() {
  if [ "$TEST_MODE" = true ]; then
    echo "$@"
  else
    "$@"
  fi
}

# Prune Docker images if not disabled
if [ "$DONT_PRUNE" = false ]; then
  echo "Pruning Docker images..."
  run_command docker system prune -af
fi

# Define images and their contexts
IMAGES=(
  "helicone/web:.."
  "helicone/migrations:.."
  "helicone/jawn:.."
)

# Process each image
for IMAGE_INFO in "${IMAGES[@]}"; do
  IFS=':' read -r IMAGE_NAME CONTEXT <<< "$IMAGE_INFO"
  
  # Skip if specific images were selected and this isn't one of them
  if [ ${#SELECTED_IMAGES[@]} -gt 0 ]; then
    SKIP=true
    for SELECTED in "${SELECTED_IMAGES[@]}"; do
      if [[ "$IMAGE_NAME" == *"$SELECTED"* ]]; then
        SKIP=false
        break
      fi
    done
    if [ "$SKIP" = true ]; then
      echo "Skipping $IMAGE_NAME (not selected)"
      continue
    fi
  fi
  
  echo "Processing $IMAGE_NAME..."
  
  # Get Dockerfile path
  DOCKERFILE_NAME=$(basename "$IMAGE_NAME" | tr '-' '_')
  DOCKERFILE_PATH="dockerfiles/dockerfile_${DOCKERFILE_NAME}"
  
  if [ "$DOCKERFILE_NAME" = "jawn" ]; then
    DOCKERFILE_PATH="../valhalla/dockerfile"
  fi
  
  # Build image
  FULL_IMAGE_TAG="$IMAGE_NAME:$VERSION_TAG"
  echo "Building $FULL_IMAGE_TAG..."
  run_command docker build --platform linux/amd64 -t "$FULL_IMAGE_TAG" -f "$DOCKERFILE_PATH" "$CONTEXT"
  
  # Push version tag
  echo "Pushing $FULL_IMAGE_TAG..."
  run_command docker push "$FULL_IMAGE_TAG"
  
  # Tag and push latest
  echo "Tagging and pushing latest..."
  run_command docker tag "$FULL_IMAGE_TAG" "$IMAGE_NAME:latest"
  run_command docker push "$IMAGE_NAME:latest"
done

echo "Done!" 