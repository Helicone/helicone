FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

RUN npm install -g @anthropic-ai/claude-code

RUN mkdir -p /tmp && curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sudo sh /tmp/get-docker.sh

RUN apt install python3.11-venv

RUN curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
RUN sudo apt update
RUN sudo apt install stripe