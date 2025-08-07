#!/bin/bash

# Exit on error
set -e

# Default values
MODE=""
AWS_REGION="us-east-2"
CUSTOM_TAG=""
TEST_MODE=false
DONT_PRUNE=false
SELECTED_IMAGES=()
PLATFORMS="linux/amd64,linux/arm64"

# Function to show usage
show_usage() {
  echo "Usage: $0 --mode <dockerhub|ecr> [OPTIONS]"
  echo ""
  echo "Modes:"
  echo "  --mode dockerhub    Push to Docker Hub"
  echo "  --mode ecr          Push to AWS ECR"
  echo ""
  echo "Options:"
  echo "  -t, --test          Test mode (show commands without executing)"
  echo "  --dont-prune        Don't prune Docker images before building"
  echo "  -c, --custom-tag    Custom tag suffix"
  echo "  -r, --region        AWS region (default: us-east-2, ECR mode only)"
  echo "  -i, --image         Select specific image to build (can be used multiple times)"
  echo "  -p, --platforms     Target platforms (default: linux/amd64,linux/arm64)"
  echo "  -h, --help          Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --mode dockerhub"
  echo "  $0 --mode ecr --region us-west-2 --custom-tag hotfix"
  echo "  $0 --mode dockerhub --test"
  echo "  $0 --mode ecr --image web --image jawn"
  echo "  $0 --mode dockerhub --platforms linux/amd64"
  echo "  $0 --mode ecr --platforms linux/arm64,linux/amd64"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      MODE="$2"
      shift 2
      ;;
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
    -i|--image)
      SELECTED_IMAGES+=("$2")
      shift 2
      ;;
    -p|--platforms)
      PLATFORMS="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Validate mode is provided
if [ -z "$MODE" ]; then
  echo "Error: --mode is required"
  show_usage
  exit 1
fi

# Validate mode value
if [[ "$MODE" != "dockerhub" && "$MODE" != "ecr" ]]; then
  echo "Error: --mode must be either 'dockerhub' or 'ecr'"
  show_usage
  exit 1
fi

# Function to run commands in test mode or normal mode
run_command() {
  if [ "$TEST_MODE" = true ]; then
    echo "$@"
  else
    "$@"
  fi
}

# Function to setup Docker buildx for multi-platform builds
setup_buildx() {
  echo "Setting up Docker buildx for multi-platform builds..."
  
  # Create a new builder instance if it doesn't exist
  if ! docker buildx ls | grep -q "helicone-builder"; then
    echo "Creating new buildx builder 'helicone-builder'..."
    run_command docker buildx create --name helicone-builder --use
  else
    echo "Using existing buildx builder 'helicone-builder'..."
    run_command docker buildx use helicone-builder
  fi
  
  # Bootstrap the builder
  run_command docker buildx inspect --bootstrap
}

# Function to create ECR repository if it doesn't exist (ECR mode only)
create_ecr_repo() {
  local repo_name=$1
  echo "Checking if repository $repo_name exists..."
  if ! aws ecr describe-repositories --repository-names "$repo_name" --region "$AWS_REGION" &>/dev/null; then
    echo "Creating repository $repo_name..."
    run_command aws ecr create-repository \
      --repository-name "$repo_name" \
      --image-scanning-configuration scanOnPush=true \
      --region "$AWS_REGION"
  fi
}

# Function to get existing ECR tags and find available version tag
get_available_ecr_tag() {
  local repo_name=$1
  local base_tag=$2
  
  echo "Checking existing tags for ECR repository $repo_name..." >&2
  local existing_tags
  existing_tags=$(aws ecr describe-images --repository-name "$repo_name" --region "$AWS_REGION" --query 'imageDetails[].imageTags[]' --output text 2>/dev/null || echo "")
  
  local tag=$base_tag
  local counter=1
  while [[ $existing_tags =~ $tag ]]; do
    tag=$base_tag-$counter
    ((counter++))
  done
  
  echo "$tag"
}

# Setup Docker buildx for multi-platform builds
setup_buildx

# Prune Docker images if not disabled
if [ "$DONT_PRUNE" = false ]; then
  echo "Pruning Docker images..."
  if [ "$MODE" = "dockerhub" ]; then
    run_command bash -c 'echo "y" | docker system prune -a'
  else
    run_command docker system prune -af
  fi
fi

# Generate version tag
if [ "$MODE" = "dockerhub" ]; then
  DATE=$(date +%Y.%m.%d)
  VERSION_TAG="v$DATE"
else
  VERSION_TAG="v$(date +'%Y-%m-%d')"
fi

if [ ! -z "$CUSTOM_TAG" ]; then
  if [ "$MODE" = "dockerhub" ]; then
    VERSION_TAG="${VERSION_TAG}-${CUSTOM_TAG}"
  else
    VERSION_TAG="${VERSION_TAG}-${CUSTOM_TAG}"
  fi
fi

# Define images and their contexts (unified for both modes)
IMAGES=(
  "helicone/web:.."
  "helicone/jawn:.."
  "helicone/migrations:.."
)

# Docker Hub mode
if [ "$MODE" = "dockerhub" ]; then
  echo "=== Docker Hub Mode ==="
  
  # Filter out legacy dockerhub-only images for the unified approach
  DOCKERHUB_IMAGES=(
    "helicone/web:.."
    "helicone/jawn:.."
    "helicone/migrations:.."
  )
  
  # Filter images if specific ones were selected
  if [ ${#SELECTED_IMAGES[@]} -gt 0 ]; then
    FILTERED_IMAGES=()
    for IMAGE_INFO in "${DOCKERHUB_IMAGES[@]}"; do
      IFS=':' read -r IMAGE_NAME _ <<< "$IMAGE_INFO"
      for SELECTED in "${SELECTED_IMAGES[@]}"; do
        if [[ "$IMAGE_NAME" == *"$SELECTED"* ]]; then
          FILTERED_IMAGES+=("$IMAGE_INFO")
          break
        fi
      done
    done
    DOCKERHUB_IMAGES=("${FILTERED_IMAGES[@]}")
  fi
  
  for IMAGE_INFO in "${DOCKERHUB_IMAGES[@]}"; do
    IFS=':' read -r IMAGE_NAME CONTEXT <<< "$IMAGE_INFO"
    echo "Processing $IMAGE_NAME..."
    
    # Get the Docker tags for the current image from Docker Hub
    echo "Checking existing tags for $IMAGE_NAME..."
    tags=$(curl -s "https://hub.docker.com/v2/repositories/${IMAGE_NAME}/tags/?page_size=100" | jq -r '.results|.[]|.name' 2>/dev/null || echo "")

    # Check if the current date tag exists already
    tag=$VERSION_TAG
    counter=1
    while [[ $tags =~ $tag ]]; do
      # If it does, increment the counter and append it to the date tag
      tag=$VERSION_TAG-$counter
      ((counter++))
    done

    # Get Dockerfile path and context
    DOCKERFILE_NAME=$(basename "$IMAGE_NAME" | tr '-' '_')
    DOCKERFILE_PATH="dockerfiles/dockerfile_${DOCKERFILE_NAME}"
    BUILD_CONTEXT="$CONTEXT"
    
    if [ "$DOCKERFILE_NAME" = "jawn" ]; then
      DOCKERFILE_PATH="../valhalla/dockerfile"
    elif [ "$DOCKERFILE_NAME" = "migrations" ]; then
      DOCKERFILE_PATH="dockerfiles/dockerfile_migrations"
    elif [ "$DOCKERFILE_NAME" = "ai_gateway" ]; then
      DOCKERFILE_PATH="../aigateway/Dockerfile"
      BUILD_CONTEXT="../aigateway"
    fi

    # Build and push multi-platform image
    FULL_IMAGE_TAG="$IMAGE_NAME:$tag"
    LATEST_TAG="$IMAGE_NAME:latest"
    echo "Building and pushing multi-platform image $FULL_IMAGE_TAG for platforms: $PLATFORMS"
    run_command docker buildx build \
      --platform "$PLATFORMS" \
      -t "$FULL_IMAGE_TAG" \
      -t "$LATEST_TAG" \
      -f "$DOCKERFILE_PATH" \
      --push \
      "$BUILD_CONTEXT"
  done

# ECR mode
elif [ "$MODE" = "ecr" ]; then
  echo "=== ECR Mode ==="
  
  # Get AWS account ID
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  
  # Login to ECR
  echo "Logging in to ECR..."
  run_command aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
  
  # Use only the core images for ECR
  ECR_IMAGES=(
    "helicone/web:.."
    "helicone/jawn:.."
    "helicone/migrations:.."
    "helicone/ai-gateway:.."
  )
  
  # Create ECR repositories first
  for IMAGE_INFO in "${ECR_IMAGES[@]}"; do
    IFS=':' read -r IMAGE_NAME _ <<< "$IMAGE_INFO"
    
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
        continue
      fi
    fi
    
    create_ecr_repo "$IMAGE_NAME"
  done

  # Process each image
  for IMAGE_INFO in "${ECR_IMAGES[@]}"; do
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
    
    # Get available tag (with counter if needed)
    tag=$(get_available_ecr_tag "$IMAGE_NAME" "$VERSION_TAG")
    
    # Get Dockerfile path and context
    DOCKERFILE_NAME=$(basename "$IMAGE_NAME" | tr '-' '_')
    DOCKERFILE_PATH="dockerfiles/dockerfile_${DOCKERFILE_NAME}"
    BUILD_CONTEXT="$CONTEXT"
    
    if [ "$DOCKERFILE_NAME" = "jawn" ]; then
      DOCKERFILE_PATH="../valhalla/dockerfile"
    elif [ "$DOCKERFILE_NAME" = "migrations" ]; then
      DOCKERFILE_PATH="dockerfiles/dockerfile_migrations"
    elif [ "$DOCKERFILE_NAME" = "ai_gateway" ]; then
      DOCKERFILE_PATH="../aigateway/Dockerfile"
      BUILD_CONTEXT="../aigateway"
    fi
    
    # Build and push multi-platform image
    ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME"
    FULL_IMAGE_TAG="$ECR_REPO:$tag"
    LATEST_TAG="$ECR_REPO:latest"
    echo "Building and pushing multi-platform image $FULL_IMAGE_TAG for platforms: $PLATFORMS"
    run_command docker buildx build \
      --platform "$PLATFORMS" \
      -t "$FULL_IMAGE_TAG" \
      -t "$LATEST_TAG" \
      -f "$DOCKERFILE_PATH" \
      --push \
      "$BUILD_CONTEXT"
  done
fi

echo "Done!" 