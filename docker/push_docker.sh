#!/bin/bash

# Exit on error
set -e

# Default values
CUSTOM_TAG=""
TEST_MODE=false
DONT_PRUNE=false
SELECTED_IMAGES=()
PLATFORMS="linux/amd64,linux/arm64"
DEFAULT_PLATFORMS="$PLATFORMS"
CLOUD_BUILDER=false

# Function to show usage
show_usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Push Helicone images to Docker Hub."
  echo ""
  echo "Options:"
  echo "  -t, --test          Test mode (show commands without executing)"
  echo "  --dont-prune        Don't prune Docker images before building"
  echo "  -c, --custom-tag    Custom tag suffix"
  echo "  -i, --image         Select specific image to build (can be used multiple times)"
  echo "  -p, --platforms     Target platforms (default: linux/amd64,linux/arm64)"
  echo "  -h, --help          Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0"
  echo "  $0 --custom-tag hotfix"
  echo "  $0 --test"
  echo "  $0 --image web --image jawn"
  echo "  $0 --platforms linux/amd64"
}

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

  # Prefer builder supplied by CI (from docker/setup-buildx-action outputs)
  if [ -n "$BUILDX_BUILDER" ]; then
    echo "Using buildx builder from environment: '$BUILDX_BUILDER'"
    run_command docker buildx use "$BUILDX_BUILDER"
  else
    # Try to detect an already selected builder (leading '*' in ls output)
    CURRENT_BUILDER=$(docker buildx ls 2>/dev/null | sed -n 's/^\* \([^ ]\+\).*/\1/p' || true)
    if [ -n "$CURRENT_BUILDER" ]; then
      echo "Detected current buildx builder '$CURRENT_BUILDER'. Using it as-is."
      run_command docker buildx use "$CURRENT_BUILDER"
    else
      # Fallback: create or use a local builder
      if ! docker buildx ls | grep -q "helicone-builder"; then
        echo "Creating new buildx builder 'helicone-builder'..."
        run_command docker buildx create --name helicone-builder --use
      else
        echo "Using existing buildx builder 'helicone-builder'..."
        run_command docker buildx use helicone-builder
      fi
    fi
  fi

  # Determine if current builder is cloud
  ACTIVE_BUILDER=$(docker buildx ls 2>/dev/null | sed -n 's/^\* \([^ ]\+\).*/\1/p' || true)
  if [ -z "$ACTIVE_BUILDER" ] && [ -n "$BUILDX_BUILDER" ]; then
    ACTIVE_BUILDER="$BUILDX_BUILDER"
  fi
  DRIVER_LINE=$(docker buildx inspect "$ACTIVE_BUILDER" 2>/dev/null | grep -i '^Driver:' || true)
  if echo "$DRIVER_LINE" | grep -qi 'cloud'; then
    CLOUD_BUILDER=true
  fi

  # Bootstrap the builder
  run_command docker buildx inspect --bootstrap
}

# Ensure a local builder exists and switch to it
switch_to_local_builder() {
  echo "Switching to local buildx builder..."
  if ! docker buildx ls | grep -q "helicone-builder"; then
    echo "Creating local buildx builder 'helicone-builder'..."
    # Use run_command to respect test mode
    run_command docker buildx create --name helicone-builder --use
  else
    echo "Using existing local buildx builder 'helicone-builder'..."
    run_command docker buildx use helicone-builder
  fi
  CLOUD_BUILDER=false
}

# Try a bake; if it fails on a cloud builder (e.g., no credits), fall back to local and retry once
attempt_bake_with_fallback() {
  local target=$1
  local full_tag=$2
  local latest_tag=$3
  set +e
  if [ "$TEST_MODE" = true ]; then
    echo docker buildx bake --allow=fs.read=.. -f docker-bake.hcl --push "$target" --set "$target.platform=$PLATFORMS" --set "$target.tags=$full_tag" --set "$target.tags+=$latest_tag"
    set -e
    return 0
  fi
  docker buildx bake --allow=fs.read=.. -f docker-bake.hcl --push "$target" --set "$target.platform=$PLATFORMS" --set "$target.tags=$full_tag" --set "$target.tags+=$latest_tag"
  local status=$?
  if [ $status -ne 0 ] && [ "$CLOUD_BUILDER" = true ]; then
    echo "Cloud bake failed (possibly out of credits). Falling back to local builder..."
    switch_to_local_builder
    if [ "$DONT_PRUNE" = false ]; then
      echo "Pruning Docker images before local fallback bake..."
      run_command docker system prune -af
    fi
    docker buildx bake --allow=fs.read=.. -f docker-bake.hcl --push "$target" --set "$target.platform=$PLATFORMS" --set "$target.tags=$full_tag" --set "$target.tags+=$latest_tag"
    status=$?
  fi
  set -e
  return $status
}



# Setup Docker buildx for multi-platform builds
setup_buildx
INITIAL_CLOUD_BUILDER=$CLOUD_BUILDER

# If running on a local builder and the user didn't override --platforms, default to single-platform to reduce memory usage
if [ "$CLOUD_BUILDER" = false ] && [ "$PLATFORMS" = "$DEFAULT_PLATFORMS" ]; then
  echo "Detected local buildx builder. Defaulting to single-platform linux/amd64 to reduce memory usage. Use --platforms to override."
  PLATFORMS="linux/amd64"
fi

# Prune Docker images if not disabled (skip when using a cloud builder)
if [ "$DONT_PRUNE" = false ] && [ "$CLOUD_BUILDER" = false ]; then
  echo "Pruning Docker images..."
  run_command docker system prune -af
fi

# Generate version tag
DATE=$(date +%Y.%m.%d)
VERSION_TAG="v$DATE"

if [ ! -z "$CUSTOM_TAG" ]; then
  VERSION_TAG="${VERSION_TAG}-${CUSTOM_TAG}"
fi

# Note: image lists now defined per-registry section; unused IMAGES removed

echo "=== Docker Hub Push ==="

# Filter out legacy dockerhub-only images for the unified approach
DOCKERHUB_IMAGES=(
  "helicone/web:.."
  "helicone/jawn:.."
  "helicone/postgres-migrations:.."
  "helicone/clickhouse-migrations:.."
  "helicone/helicone-all-in-one:.."
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
  IFS=':' read -r IMAGE_NAME _ <<< "$IMAGE_INFO"
  echo "Processing $IMAGE_NAME..."

  # Get the Docker tags for the current image from Docker Hub
  echo "Checking existing tags for $IMAGE_NAME..."
  tags=$(curl -s "https://hub.docker.com/v2/repositories/${IMAGE_NAME}/tags/?page_size=100" | jq -r '.results|.[]|.name' 2>/dev/null || echo "")

  # Check if the current date tag exists already
  tag=$VERSION_TAG
  counter=1
  while [[ $tags =~ $tag ]]; do
    tag=$VERSION_TAG-$counter
    ((counter++))
  done

  # Map image to bake target name and tags
  DOCKERFILE_NAME=$(basename "$IMAGE_NAME" | tr '-' '_')
  BAKE_TARGET="$DOCKERFILE_NAME"
  if [[ "$DOCKERFILE_NAME" == *"all_in_one" ]]; then
    BAKE_TARGET="all_in_one"
  fi
  FULL_IMAGE_TAG="$IMAGE_NAME:$tag"
  LATEST_TAG="$IMAGE_NAME:latest"
  echo "Baking target $BAKE_TARGET with tags: $FULL_IMAGE_TAG and $LATEST_TAG"
  if [[ "$DOCKERFILE_NAME" == *"all_in_one" ]]; then
    # Always use local builder for the all-in-one image
    switch_to_local_builder
    if [ "$DONT_PRUNE" = false ] && [ "$INITIAL_CLOUD_BUILDER" = true ]; then
      echo "Pruning Docker images before local all-in-one bake..."
      run_command docker system prune -af
    fi
    if [ "$TEST_MODE" = true ]; then
      echo docker buildx bake --allow=fs.read=.. -f docker-bake.hcl --push "$BAKE_TARGET" --set "$BAKE_TARGET.platform=$PLATFORMS" --set "$BAKE_TARGET.tags=$FULL_IMAGE_TAG" --set "$BAKE_TARGET.tags+=$LATEST_TAG"
    else
      docker buildx bake --allow=fs.read=.. -f docker-bake.hcl --push "$BAKE_TARGET" --set "$BAKE_TARGET.platform=$PLATFORMS" --set "$BAKE_TARGET.tags=$FULL_IMAGE_TAG" --set "$BAKE_TARGET.tags+=$LATEST_TAG"
    fi
  else
    attempt_bake_with_fallback "$BAKE_TARGET" "$FULL_IMAGE_TAG" "$LATEST_TAG"
  fi
done

echo "Done!" 