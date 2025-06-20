## 🧑‍💻 Local development

Run the following commands to get started with local development of the Helicone AI Gateway.

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Helicone API key](https://docs.helicone.ai/api-keys)
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Helicone/helicone-router.git
   cd helicone-router
   ```

1. **Environment Setup**
   ```bash
   # Copy environment template and configure
   cp .env.template .env
   ```
   Fill out the following environment variables in you .env file:
   - `HELICONE_CONTROL_PLANE_API_KEY`
   - `HELICONE_API_KEY`
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`

2. **Start Services**
   ```bash
   # Start docker compose stack
   cd infrastructure && docker compose up -d && cd ..
   ```

3. **Run the Router**
   ```bash
   # With default configs
   cargo run

   # Or with a dev config file
   cargo rl
   ```

4. **Testing**
   ```bash
   # Run an HTTP request against the router
   cargo run -p test

   # Run unit + integration tests
   cargo int-test
   ```
