#!/bin/bash

set -e

TEST_MODE=0

# Parse arguments
while getopts ":t" opt; do
  case ${opt} in
    t )
      TEST_MODE=1
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      exit 1
      ;;
  esac
done

echo "y" | docker system prune -a

# Get the current date
DATE=$(date +%Y.%m.%d)
DATE="v$DATE"

# Docker images to build and push
declare -a docker_images=( \
      "helicone/supabase-migration-runner" \
      "helicone/worker" \
      "helicone/web" \
      "helicone/clickhouse-migration-runner" \
      "helicone/jawn"
)


run_or_echo() {
  if [[ $TEST_MODE -eq 1 ]]; then
    echo "$@"
  else
    "$@"
  fi
}

for image in "${docker_images[@]}"; do
  # Get the Docker tags for the current image from Docker Hub
  tags=$(curl -s "https://hub.docker.com/v2/repositories/${image}/tags/?page_size=100" | jq -r '.results|.[]|.name')

  # Check if the current date tag exists already
  tag=$DATE
  counter=1
  while [[ $tags =~ $tag ]]; do
    # If it does, increment the counter and append it to the date tag
    tag=$DATE-$counter
    ((counter++))
  done

  # Replace dash "-" with underscore "_" in Dockerfile name
  dockerfile_name=$(basename $image | tr '-' '_')

  # Special handling for the jawn image
  if [[ "$dockerfile_name" == "jawn" ]]; then
    DOCKERFILE_PATH="../valhalla/dockerfile"
  else
    DOCKERFILE_PATH="dockerfiles/dockerfile_${dockerfile_name}"
  fi

  run_or_echo docker build --platform linux/amd64 -t ${image}:$tag -f $DOCKERFILE_PATH ..
  run_or_echo docker push ${image}:$tag
  run_or_echo docker tag ${image}:$tag ${image}:latest
  run_or_echo docker push ${image}:latest
done