# Helicone Self-Host Progress

## Repository Setup
- ✅ Cloned the Helicone repository
- ✅ Checked out latest code and reviewed

## Environment Configuration
- ✅ Copied .env.example to /docker/.env
- ✅ Default credentials used:
  - POSTGRES_PASSWORD, JWT_SECRET, DASHBOARD_PASSWORD (need to be changed before production)
  - Default auth: MINIO_ROOT_USER="minioadmin", MINIO_ROOT_PASSWORD="minioadmin"

## Docker Compose Setup
- ✅ Added the docker-compose.yml and .env files
- ✅ ran `cd docker && ./helicone-compose.sh helicone up`
- ℹ️ Some containers exit after successful run (e.g. migrations)
- ✅ Verified services:
  - helicone-web: 3000
  - jawn: 8585 
  - postgres: 54388
  - clickhouse: 18123
  - minio: 9000
  - mailhog: 8025

## ⚠️ Issues Identified

- ⚠️ Jawn Service Error: 
```
Error downloading model: An error occurred (403) when calling the HeadObject operation: Forbidden
FATAL: Error during model initialization
```
This appears to be an issue with the prompt-guard model not being downloaded correctly.

- ⚠️ API Logging Error:
```
Error: Region is missing
```
When trying to use the direct logging API endpoints, we encounter an error related to S3/MinIO configuration. This happens because the S3 client in Helicone requires a region parameter, even when using MinIO.

## Possible Fix Options

1. Try running without source modifications
   - Despite the prompt-guard model download error, the web interface is fully accessible
   - Login works with the default test credentials
   - We can access the dashboard and see the organization

2. ✅ Fixed S3/MinIO "Region is missing" error
   - **Solution:** Added `S3_REGION: us-west-2` to the Jawn service configuration in `docker/docker-compose.yml`
   - The AWS SDK S3 client requires a region parameter even for MinIO
   - This environment variable can be found in various files that initialize the S3Client with:
     ```typescript
     (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
     ```
   - Note: It's important to modify docker-compose.yml directly because the hardcoded values take precedence over .env file configurations
   
   Alternative options (not needed since MinIO now works):
   - Could use Cloudflare R2 instead of MinIO
   - Created R2 bucket "helicone-storage" using Wrangler
   - Would need to update S3 credentials in docker-compose.yml for all services

## Environment Variable Configuration 

The following environment variables should be set in the docker/.env file and/or docker-compose.yml file depending on your needs:

### Required Environment Variables

- **S3_REGION**: Must be set to a valid AWS region (e.g., `us-west-2` or `eu-west-1`) even when using MinIO
- **S3_ENDPOINT**: URL endpoint for your storage service
  - MinIO (default): `http://minio:9000` (in docker-compose.yml for containers)
  - MinIO (public): `http://localhost:9000` (in S3_ENDPOINT_PUBLIC)
  - R2: Your R2 endpoint URL from Cloudflare dashboard
- **S3_ACCESS_KEY**: Access key for your storage service
- **S3_SECRET_KEY**: Secret key for your storage service
- **S3_BUCKET_NAME**: Bucket name (default is "request-response-storage" for MinIO)

### Important Notes

1. When using the docker-compose.yml setup, environment variables are set directly in the file for each service and take precedence over values in the .env file
2. If you want to switch between MinIO and R2, you'll need to update the credentials in docker-compose.yml, not just in the .env file
3. The `S3_REGION` parameter is critical - it must be set even when using MinIO

## Default Login Credentials

- **Username**: test@helicone.ai
- **Password**: password
- After login, switch to **Organization for Test** to view requests

## Common Issues Found in GitHub Repo

1. **ClickHouse Migration Issues** (missing tables, syntax errors)
2. **API Response Parsing Errors**
3. **Incorrect access URLs** (proper Supabase auth URL is http://localhost:54323/project/default/auth/users)

## Configuring Cloudflare R2 (Instructions)

After creating the R2 API tokens in the Cloudflare dashboard, follow these steps to configure Helicone to use R2 instead of MinIO:

1. Update the `.env` file with R2 credentials:
```
# Replace MinIO with Cloudflare R2 settings
S3_ACCESS_KEY="your-r2-access-key-id"
S3_SECRET_KEY="your-r2-secret-access-key"
AWS_REGION="auto"  # R2 uses 'auto' or 'us-east-1'
S3_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
```

2. Restart the Helicone services:
```
cd docker && ./helicone-compose.sh helicone down
cd docker && ./helicone-compose.sh helicone up
```

3. Test the API endpoint:
```
curl -X POST "http://localhost:8585/v1/trace/custom/v1/log" \
-H "Authorization: Bearer sk-helicone-ocuczga-k2hebcy-ttgyy6a-k6z7mgy" \
-H "Content-Type: application/json" \
-d '{
    "providerRequest": {
      "url": "custom-model-nopath",
      "json": {
        "model": "your-model-name",
        "messages": [{"role": "user", "content": "Hello!"}]
      },
      "meta": {
        "environment": "production"
      }
    },
    "providerResponse": {
      "json": {
        "choices": [{"message": {"content": "Hello there!"}}]
      },
      "status": 200,
      "headers": {
        "content-type": "application/json"
      }
    },
    "timing": {
      "startTime": {
        "seconds": 1749648445,
        "milliseconds": 0
      },
      "endTime": {
        "seconds": 1749648455,
        "milliseconds": 500
      }
    }
  }'
```

## Next Steps

1. ✏️ Configure Cloudflare R2 with the API tokens created in the dashboard
2. ✏️ Test the custom logging API endpoint with R2 configuration
3. ✏️ Document any other issues encountered with the custom logging
4. ✏️ Finalize the fork to the pollinations organization
5. ✏️ Create documentation for the Helicone self-hosting setup in the forked repo

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
