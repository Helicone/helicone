#!/usr/bin/env bash

build_backend() {
  cd backend/
  docker build -t "rockstar-api:release" .
  cd ..
}

build_frontend() {
  cd frontend/
  docker build -f Dockerfile.web -t "rockstar-web:release" .
  cd ..
}

build_frontend_admin() {
  cd frontend/
  docker build -f Dockerfile.admin -t "rockstar-web-admin:release" .
  cd ..
}

build_redis() {
  cd infrastructure/redis/
  docker build -t "rockstar-redis:release" .
  cd ../../
}

help() {
  echo "Usage: deploy [--force] <app>"
  echo
  echo "Run from the root of the repo."
  echo "Available apps:"
  echo " - rockstar-api"
  echo " - rockstar-web"
  echo " - rockstar-web-admin"
  echo " - otel-collector"
  echo " - tempo"
  echo " - loki"
  echo " - grafana"
  echo " - postgres"
  echo " - redis"
  echo
  echo "Options:"
  echo " --force    Always deploy, regardless of image label comparison"
  exit "$1"
}

get_dir_hash() {
  local dir=$1
  find "$dir" -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1 | head -c 8
}

FLY_CONFIG_FILE="fly.toml"
FORCE_DEPLOY=false

# Parse command line arguments
if [ "$1" = "--force" ]; then
  FORCE_DEPLOY=true
  shift
fi

case "${1:-}" in
  rockstar-api)
    APP_DIR="backend"
    ;;
  rockstar-web)
    FLY_CONFIG_FILE="fly.toml.web"
    APP_DIR="frontend"
    ;;
  rockstar-web-admin)
    FLY_CONFIG_FILE="fly.toml.admin"
    APP_DIR="frontend"
    ;;
  otel-collector)
    APP_DIR="infrastructure/opentelemetry-collector"
    ;;
  tempo)
    APP_DIR="infrastructure/tempo"
    ;;
  loki)
    APP_DIR="infrastructure/loki"
    ;;
  grafana)
    APP_DIR="infrastructure/grafana"
    ;;
  postgres)
    APP_DIR="infrastructure/postgres"
    ;;
  redis)
    APP_DIR="infrastructure/redis"
    ;;
  *)
    help 1
    ;;
esac

case "${1:-}" in
  rockstar-api)
    echo "building backend"
    build_backend
    image_label=$(docker images --quiet | head -n 1)
    ;;
  rockstar-web)
    echo "building frontend"
    build_frontend
    image_label=$(docker images --quiet | head -n 1)
    ;;
  rockstar-web-admin)
    echo "building frontend admin"
    build_frontend_admin
    image_label=$(docker images --quiet | head -n 1)
    ;;
  redis)
    echo "building redis"
    build_redis
    image_label=$(docker images --quiet | head -n 1)
    ;;
esac

case "${1:-}" in
  otel-collector)
    image_label=$(get_dir_hash "infrastructure/opentelemetry-collector")
    ;;
  tempo)
    image_label=$(get_dir_hash "infrastructure/tempo")
    ;;
  loki)
    image_label=$(get_dir_hash "infrastructure/loki")
    ;;
  grafana)
    image_label=$(get_dir_hash "infrastructure/grafana")
    ;;
  postgres)
    image_label=$(get_dir_hash "infrastructure/postgres")
    ;;
esac

echo "Config file: $APP_DIR/$FLY_CONFIG_FILE"
echo "Image label: $image_label"

deployed_label=$(fly image show --config "$APP_DIR/$FLY_CONFIG_FILE" | awk 'NR==3{print $4}')
echo "deployed image label: $deployed_label"

if [ "$FORCE_DEPLOY" = true ] || [ "$image_label" != "$deployed_label" ]; then
  echo "Starting deployment..."
  flyctl deploy "$APP_DIR" --local-only --config "$FLY_CONFIG_FILE" --image-label "$image_label"
else
  echo "Deployed docker image label is equal to built one, not deploying"
fi
