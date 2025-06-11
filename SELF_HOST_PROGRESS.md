# Helicone Self-Hosting Progress

## What We've Done So Far

1. **Repository Setup**
   - Cloned the Helicone repository
   - Modified `.gitignore` files to allow viewing of the `.env` file

2. **Environment Configuration**
   - Copied the `.env.example` to `.env` in the docker directory
   - Kept the default configuration values

3. **Docker Compose Setup**
   - Ran `cd docker && ./helicone-compose.sh helicone up`
   - Successfully started containers:
     - helicone-web
     - helicone-jawn
     - helicone-clickhouse
     - helicone-postgres-flyway-test
     - helicone-minio
     - mailhog

4. **Issues Identified**
   - The Jawn service showed errors with the prompt-guard model download:
     ```
     Error downloading model: An error occurred (403) when calling the HeadObject operation: Forbidden
     FATAL: Error during model initialization
     ```
   - Migration container (`helicone-self-host-migrations-1`) ran but exited
   - Based on GitHub issues research, there appear to be common issues with ClickHouse migrations and data structures

5. **Success!**
   - Despite the prompt-guard model download error, the web interface is fully accessible
   - Login works with the default test credentials
   - We can access the dashboard and see the organization

## Default Login Credentials

- **Username**: test@helicone.ai
- **Password**: password
- After login, switch to **Organization for Test** to view requests

## Common Issues Found in GitHub Repo

1. **ClickHouse Migration Issues** (missing tables, syntax errors)
2. **API Response Parsing Errors**
3. **Incorrect access URLs** (proper Supabase auth URL is http://localhost:54323/project/default/auth/users)

## Current Status: Working Successfully!

1. **Successful Setup Without Source Modifications**
   - We were able to run Helicone without modifying any source files using this procedure:
     ```bash
     cd docker
     ./helicone-compose.sh helicone down  # Stop any existing containers
     cp -n .env.example .env  # Use default configuration
     ./helicone-compose.sh helicone up -d
     ```

2. **Web Interface**
   - The web interface is accessible at http://localhost:3000
   - Login with the default credentials: 
     - Username: `test@helicone.ai` 
     - Password: `password`
   - After login, change the organization to **Organization for Test**

3. **Known Issues**
   - The Jawn service shows a non-critical error with the prompt-guard model download:
     ```
     Error downloading model: An error occurred (403) when calling the HeadObject operation: Forbidden
     FATAL: Error during model initialization
     ```
   - This error doesn't prevent the web interface from functioning correctly
   
4. **Next Steps**
   - Create a fork of the Helicone repository to the pollinations organization
   - Push our changes and documentation
   - Consider implementing the prompt-guard model fix if needed

5. **Testing API Functionality**
   - Use the example curl command to test the API functionality:
     ```bash
     curl --location 'http://localhost:8585/jawn/v1/gateway/oai/v1/completions' \
     --header 'Content-Type: application/json' \
     --header 'Authorization: Bearer {{OPENAI_API_KEY}}' \
     --header 'Helicone-Auth: Bearer {{HELICONE_API_KEY}}' \
     --data '{ "model": "gpt-4o-mini", "prompt": "Count to 5", "stream": false }'
     ```
   - Replace `{{OPENAI_API_KEY}}` with a valid OpenAI API key
   - Use `sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa` as the Helicone API key

## Available Service URLs

- Helicone Webpage (frontend): http://localhost:3000
- Jawn (backend): http://localhost:8585/v1/gateway/oai/v1/chat/completions  
- Postgres (database): localhost:54388
- Clickhouse (analytics): localhost:18123
- Minio (object storage): localhost:9000
- Mailhog (email testing): http://localhost:8025
