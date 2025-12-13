FROM clickhouse/clickhouse-server:24.3.13.40 AS database-stage

# Install PostgreSQL and other dependencies
RUN apt-get update && apt-get install -y \
    postgresql-common \
    python3.11 \
    python3.11-dev \
    python3-pip \
    openjdk-17-jre-headless \
    wget \
    unzip \
    curl \
    supervisor \
    && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y \
    && apt-get install -y \
    postgresql-17 \
    postgresql-client-17 \
    postgresql-contrib-17 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Flyway directly
RUN wget -q -O flyway.tar.gz https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/10.5.0/flyway-commandline-10.5.0.tar.gz \
    && mkdir -p /opt/flyway \
    && tar -xzf flyway.tar.gz -C /opt/flyway --strip-components=1 \
    && rm flyway.tar.gz \
    && ln -s /opt/flyway/flyway /usr/local/bin/flyway \
    && flyway -v

# Install Python dependencies
RUN pip3 install --no-cache-dir requests clickhouse-driver tabulate yarl

# Create supervisord directories and copy configuration
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

ENV FLYWAY_URL=jdbc:postgresql://localhost:5432/helicone_test
ENV FLYWAY_USER=postgres
ENV FLYWAY_PASSWORD=password
ENV FLYWAY_LOCATIONS=filesystem:/app/supabase/migrations,filesystem:/app/supabase/migrations_without_supabase
ENV FLYWAY_SQL_MIGRATION_PREFIX=
ENV FLYWAY_SQL_MIGRATION_SEPARATOR=_
ENV FLYWAY_SQL_MIGRATION_SUFFIXES=.sql


COPY ./supabase/migrations /app/supabase/migrations
COPY ./supabase/migrations_without_supabase /app/supabase/migrations_without_supabase
COPY ./clickhouse/migrations /app/clickhouse/migrations
COPY ./clickhouse/seeds /app/clickhouse/seeds
COPY ./clickhouse/ch_hcone.py /app/clickhouse/ch_hcone.py
RUN chmod +x /app/clickhouse/ch_hcone.py

RUN service postgresql start && \
    su - postgres -c "createdb helicone_test" && \
    su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'password';\"" && \
    service postgresql stop

# --------------------------------------------------------------------------------------------------------------------

FROM database-stage AS jawn-stage

# Install Node.js 20 and yarn
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy only package files first for better caching
WORKDIR /app
COPY package.json yarn.lock ./
COPY web/package.json ./web/package.json
COPY valhalla/jawn/package.json ./valhalla/jawn/package.json

# Copy packages directory structure and package.json files
COPY packages ./packages
RUN find packages -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" ! -name "package.json" | xargs rm -f 2>/dev/null || true

# Install root dependencies first with cache mount
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile

# Install jawn dependencies
WORKDIR /app/valhalla/jawn
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile

# Now copy source code after dependencies are cached
WORKDIR /app
COPY packages ./packages
COPY shared ./shared
COPY valhalla ./valhalla
RUN find /app -name ".env.*" -exec rm {} \;

# Build jawn (dependencies already installed)
RUN cd valhalla/jawn && yarn build


# --------------------------------------------------------------------------------------------------------------------

FROM jawn-stage AS web-stage

# Web dependencies are already installed in jawn-stage, just copy source and build
WORKDIR /app
COPY web ./web
RUN find /app -name ".env.*" -exec rm {} \;

# Install web-specific dependencies and build
WORKDIR /app/web
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile \
    && DISABLE_ESLINT=true yarn build

# --------------------------------------------------------------------------------------------------------------------

FROM web-stage AS minio-stage

# Install MinIO server and client (arch-aware)
ARG TARGETOS
ARG TARGETARCH
RUN apt-get update && apt-get install -y curl ca-certificates && update-ca-certificates
RUN set -eu; \
    ARCH="${TARGETARCH:-amd64}"; \
    ARCH_DIR="linux-${ARCH}"; \
    MINIO_URL="https://dl.min.io/server/minio/release/${ARCH_DIR}/minio"; \
    MC_URL="https://dl.min.io/client/mc/release/${ARCH_DIR}/mc"; \
    ALT_MINIO_URL="https://dl.minio.org.cn/server/minio/release/${ARCH_DIR}/minio"; \
    ALT_MC_URL="https://dl.minio.org.cn/client/mc/release/${ARCH_DIR}/mc"; \
    echo "Downloading MinIO from $MINIO_URL"; \
    (curl -fSL --retry 5 --retry-delay 3 -o /usr/local/bin/minio "$MINIO_URL" \
      || curl -fSL --retry 5 --retry-delay 3 -o /usr/local/bin/minio "$ALT_MINIO_URL") \
    && chmod +x /usr/local/bin/minio \
    && echo "Downloading mc from $MC_URL" \
    && (curl -fSL --retry 5 --retry-delay 3 -o /usr/local/bin/mc "$MC_URL" \
      || curl -fSL --retry 5 --retry-delay 3 -o /usr/local/bin/mc "$ALT_MC_URL") \
    && chmod +x /usr/local/bin/mc \
    && /usr/local/bin/minio --version >/dev/null 2>&1 \
    && /usr/local/bin/mc --version >/dev/null 2>&1

# Create MinIO data directory
RUN mkdir -p /data

ENV POSTGRES_DB=helicone_test
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=password
ENV CLICKHOUSE_DEFAULT_USER=default

ENV CLICKHOUSE_HOST=http://localhost:8123

ENV MINIO_ROOT_USER=minioadmin
ENV MINIO_ROOT_PASSWORD=minioadmin

# Default environment variables for supervisord (can be overridden at runtime with -e)
# These are read by supervisord.conf using %(ENV_VAR)s syntax
ENV NEXT_PUBLIC_HELICONE_JAWN_SERVICE=http://localhost:8585
ENV S3_ENDPOINT=http://localhost:9080
ENV S3_ACCESS_KEY=minioadmin
ENV S3_SECRET_KEY=minioadmin
ENV S3_BUCKET_NAME=request-response-storage
ENV S3_PROMPT_BUCKET_NAME=prompt-body-storage
ENV BETTER_AUTH_SECRET=change-me-in-production

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# --------------------------------------------------------------------------------------------------------------------

EXPOSE 3000 8585 8123 9080 9001 5432