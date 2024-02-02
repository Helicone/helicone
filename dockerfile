FROM docker:dind

# Install necessary packages
RUN apk add --no-cache \
    git \
    bash \
    curl \
    py-pip 


RUN mkdir /app
WORKDIR /app

# Copy the script that will execute your commands
COPY run.sh /run.sh
RUN chmod +x /run.sh

# This script will clone the repository, copy the .env file, and start docker-compose

RUN git clone https://github.com/Helicone/helicone.git

WORKDIR /app/helicone/docker
RUN git checkout fix-env
RUN cp .env.example .env
CMD []
