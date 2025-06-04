FROM postgres:17.4 AS postgres-stage

CMD ["postgres"]

# --------------------------------------------------------------------------------------------------------------------
FROM clickhouse/clickhouse-server:24.3.13.40 AS clickhouse-stage

CMD ["clickhouse-server"]

# --------------------------------------------------------------------------------------------------------------------
FROM postgres-stage AS final-stage

# Install Python 3.11 and system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-dev \
    python3-pip \
    openjdk-17-jre-headless \
    wget \
    unzip \
    curl \
    supervisor \
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
RUN pip3 install --no-cache-dir --break-system-packages requests clickhouse-driver tabulate yarl

# Copy ClickHouse binaries and configuration from clickhouse-stage
COPY --from=clickhouse-stage /usr/bin/clickhouse* /usr/bin/
COPY --from=clickhouse-stage /etc/clickhouse-server /etc/clickhouse-server
COPY --from=clickhouse-stage /etc/clickhouse-client /etc/clickhouse-client

# Copy ClickHouse user/group setup from clickhouse-stage
COPY --from=clickhouse-stage /etc/passwd /tmp/clickhouse-passwd
COPY --from=clickhouse-stage /etc/group /tmp/clickhouse-group
RUN grep clickhouse /tmp/clickhouse-passwd >> /etc/passwd || true \
    && grep clickhouse /tmp/clickhouse-group >> /etc/group || true \
    && rm /tmp/clickhouse-passwd /tmp/clickhouse-group

# Create directories for both services
RUN mkdir -p /var/log/supervisor \
    && mkdir -p /var/lib/clickhouse \
    && mkdir -p /var/log/clickhouse-server \
    && mkdir -p /tmp/clickhouse-server \
    && chown -R clickhouse:clickhouse /var/lib/clickhouse \
    && chown -R clickhouse:clickhouse /var/log/clickhouse-server \
    && chown -R clickhouse:clickhouse /tmp/clickhouse-server

# Create supervisord directories and copy configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /app
COPY ./supabase/flyway.conf /app/supabase/flyway.conf
COPY ./supabase/migrations /app/supabase/migrations
COPY ./supabase/migrations_without_supabase /app/supabase/migrations_without_supabase
COPY ./clickhouse/migrations /app/clickhouse/migrations
COPY ./clickhouse/ch_hcone.py /app/clickhouse/ch_hcone.py
RUN chmod +x /app/clickhouse/ch_hcone.py

# Use supervisord as entrypoint
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
# docker compose down -v && docker compose up --build --force-recreate
# docker exec -it helicone-all-in-one psql -U postgres -d helicone_test
# docker exec -it helicone-all-in-one clickhouse-client