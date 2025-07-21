FROM --platform=linux/amd64 clickhouse/clickhouse-server:24.3.13.40 AS database-stage

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
    && yarn add --dev @types/js-yaml \
    && DISABLE_ESLINT=true yarn build

# --------------------------------------------------------------------------------------------------------------------

FROM web-stage AS minio-stage

# Install MinIO server and client
RUN wget -q -O /usr/local/bin/minio https://dl.min.io/server/minio/release/linux-amd64/minio \
    && chmod +x /usr/local/bin/minio \
    && wget -q -O /usr/local/bin/mc https://dl.min.io/client/mc/release/linux-amd64/mc \
    && chmod +x /usr/local/bin/mc

# Create MinIO data directory
RUN mkdir -p /data

ENV POSTGRES_DB=helicone_test
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=password
ENV CLICKHOUSE_DEFAULT_USER=default

ENV CLICKHOUSE_HOST=http://localhost:8123

ENV MINIO_ROOT_USER=minioadmin
ENV MINIO_ROOT_PASSWORD=minioadmin


# Use supervisord as entrypoint
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# --------------------------------------------------------------------------------------------------------------------

# Copy AI Gateway from existing image
COPY --from=helicone/ai-gateway:latest /app /app/gateway

# Update supervisord configuration to include all services
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy monitoring and debugging scripts
COPY monitor_logs.sh /usr/local/bin/monitor_logs
COPY debug_jawn.sh /usr/local/bin/debug_jawn
COPY health_check.sh /usr/local/bin/health_check.sh
RUN chmod +x /usr/local/bin/monitor_logs /usr/local/bin/debug_jawn /usr/local/bin/health_check.sh

# Create a volume for logs
VOLUME ["/var/log/supervisor"]

# Expose all service ports
# 3000: Web frontend, 8585: Jawn backend, 8123: ClickHouse
# 8788: AI Gateway, 9080: MinIO API, 9001: MinIO Console, 5432: PostgreSQL
EXPOSE 3000 8585 8123 8788 9080 9001 5432