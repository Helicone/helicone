FROM clickhouse/clickhouse-server:latest

# SUMMARY
# Clickhouse: 8123 (9000 TCP, 9009 inter-server)
# Postgres: 5432
# Web: 3000
# Jawn: 8585

# Install PostgreSQL and supervisord
RUN apt-get update && apt-get install -y \
    postgresql \
    postgresql-contrib \
    supervisor \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Create postgres user and initialize database
RUN service postgresql start && \
    su - postgres -c "createdb helicone" && \
    su - postgres -c "psql -c \"CREATE USER helicone WITH PASSWORD 'password';\"" && \
    su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE helicone TO helicone;\"" && \
    service postgresql stop


# Yarn + Node installation
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn


WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY web/package.json web/package.json
COPY packages ./packages
COPY shared ./shared
COPY web ./web
COPY valhalla ./valhalla
RUN find /app -name ".env.*" -exec rm {} \;

# Install web and jawn dependencies
WORKDIR /app/web
RUN yarn install

WORKDIR /app/valhalla/jawn
RUN yarn install

# Create supervisord configuration
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN apt-get update && apt-get install -y \
    openjdk-17-jre-headless \
    wget \
    unzip \
    curl \
    python3 \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Flyway using Java method (should work better cross-platform)
RUN wget -q -O flyway.tar.gz https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/10.5.0/flyway-commandline-10.5.0.tar.gz \
    && mkdir -p /opt/flyway \
    && tar -xzf flyway.tar.gz -C /opt/flyway --strip-components=1 \
    && rm flyway.tar.gz \
    && ln -s /opt/flyway/flyway /usr/local/bin/flyway \
    && flyway -v

# Install Python dependencies
RUN pip3 install --no-cache-dir requests clickhouse-driver tabulate yarl

WORKDIR /app

# Copy files with absolute paths from the root of the build context
COPY ./supabase/flyway.conf /app/supabase/flyway.conf
COPY ./supabase/migrations /app/supabase/migrations
COPY ./supabase/migrations_without_supabase /app/supabase/migrations_without_supabase
COPY ./clickhouse/migrations /app/clickhouse/migrations
COPY ./clickhouse/ch_hcone.py /app/clickhouse/ch_hcone.py
RUN chmod +x /app/clickhouse/ch_hcone.py

# Create a script to run migrations
RUN echo '#!/bin/sh \n\
    echo "Running PostgreSQL migrations..." \n\
    flyway migrate -configFiles=/app/supabase/flyway.conf \n\
    echo "PostgreSQL migrations completed" \n\
    \n\
    echo "Running ClickHouse migrations..." \n\
    python3 /app/clickhouse/ch_hcone.py --upgrade --host ${CLICKHOUSE_HOST:-helicone-core-clickhouse} --port ${CLICKHOUSE_PORT:-8123} --user ${CLICKHOUSE_USER:-default} --no-password \n\
    echo "ClickHouse migrations completed" \n\
    \n\
    echo "All migrations completed successfully!" \n\
    ' > /app/run-migrations.sh && chmod +x /app/run-migrations.sh

# Expose ports
EXPOSE 9000 8123 9009 5432 3000

# Use supervisord as entrypoint instead of ClickHouse entrypoint
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
