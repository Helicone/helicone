#!/bin/bash

# Exit on error
set -e

# Default values
AWS_REGION="us-east-2"
CUSTOM_TAG=""
TEST_MODE=false
DONT_PRUNE=false

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
    -r|--region)
      AWS_REGION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

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

# Login to ECR
echo "Logging in to ECR..."
run_command aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Prune Docker images if not disabled
if [ "$DONT_PRUNE" = false ]; then
  echo "Pruning Docker images..."
  run_command docker system prune -af
fi

# Define images and their contexts
IMAGES=(
  "helicone/worker:../worker"
  "helicone/web:../web"
  "helicone/web-dev:../web"
  "helicone/supabase-migration-runner:../supabase"
  "helicone/clickhouse-migration-runner:../clickhouse"
  "helicone/jawn:.."
)

# Process each image
for IMAGE_INFO in "${IMAGES[@]}"; do
  IFS=':' read -r IMAGE_NAME CONTEXT <<< "$IMAGE_INFO"
  echo "Processing $IMAGE_NAME..."
  
  # Get Dockerfile path
  DOCKERFILE_NAME=$(basename "$IMAGE_NAME" | tr '-' '_')
  DOCKERFILE_PATH="dockerfiles/dockerfile_${DOCKERFILE_NAME}"
  
  if [ "$DOCKERFILE_NAME" = "jawn" ]; then
    DOCKERFILE_PATH="../valhalla/dockerfile"
  fi
  
  # Build image
  ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME"
  echo "Building $ECR_REPO:$VERSION_TAG..."
  run_command docker build --platform linux/amd64 -t "$ECR_REPO:$VERSION_TAG" -f "$DOCKERFILE_PATH" "$CONTEXT"
  
  # Push version tag
  echo "Pushing $ECR_REPO:$VERSION_TAG..."
  run_command docker push "$ECR_REPO:$VERSION_TAG"
  
  # Tag and push latest
  echo "Tagging and pushing latest..."
  run_command docker tag "$ECR_REPO:$VERSION_TAG" "$ECR_REPO:latest"
  run_command docker push "$ECR_REPO:latest"
done

echo "Done!" 