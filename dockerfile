FROM docker:dind

# Install necessary packages
RUN apk add --no-cache \
    git \
    bash \
    curl \
    py-pip \
    && curl -L "https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose

# Copy the script that will execute your commands
COPY run.sh /run.sh
RUN chmod +x /run.sh

# This script will clone the repository, copy the .env file, and start docker-compose
CMD ["/run.sh"]
