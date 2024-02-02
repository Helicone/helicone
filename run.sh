#!/bin/bash
# Exit script on error
set -e

# Clone the repository
git clone https://github.com/Helicone/helicone.git

# Change directory to the docker folder
cd helicone/docker

# Checkout the fix-env branch
git checkout fix-env

# Copy the .env.example file to .env
cp .env.example .env

# Bring up the Docker Compose services
docker-compose up -d