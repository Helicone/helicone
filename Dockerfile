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

# Install Atlas CLI for migrations
RUN curl -sSf https://atlasgo.sh | sh
ENV PATH="/root/bin:/usr/local/bin:${PATH}"

# Install Python dependencies
RUN pip3 install --no-cache-dir requests clickhouse-driver tabulate yarl

# Create supervisord directories and copy configuration
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY ./postgres/migrations /app/postgres/migrations
COPY ./clickhouse/migrations /app/clickhouse/migrations
COPY ./clickhouse/seeds /app/clickhouse/seeds

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
# TODO Terrible hack to remove all non-package files from the packages directory that should be re-written
RUN find packages -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" ! -name "package.json" | xargs rm -f 2>/dev/null || true

# Install root dependencies first with cache mount
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --frozen-lockfile

# Ensure type declarations needed for the monorepo build are available at the workspace root
RUN yarn add -W -D @types/js-yaml

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
ENV POSTGRES_ATLAS_URL=postgres://postgres:password@localhost:5432/helicone_test?sslmode=disable
ENV CLICKHOUSE_DEFAULT_USER=default

# Default ClickHouse URL for Atlas migrations (can be overridden at runtime)
ENV CLICKHOUSE_URL=clickhouse://default:@localhost:9000

ENV CLICKHOUSE_HOST=http://localhost:8123

ENV MINIO_ROOT_USER=minioadmin
ENV MINIO_ROOT_PASSWORD=minioadmin


# Use supervisord as entrypoint
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# --------------------------------------------------------------------------------------------------------------------

EXPOSE 3000 8585 8123 9080 9001 5432