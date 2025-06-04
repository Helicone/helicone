FROM postgres:17.4 AS postgres-stage

CMD ["postgres"]

# --------------------------------------------------------------------------------------------------------------------
FROM python:3.11-slim AS python-stage

RUN apt-get update && apt-get install -y \  
    openjdk-17-jre-headless \
    wget \
    unzip \
    curl \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN wget -q -O flyway.tar.gz https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/10.5.0/flyway-commandline-10.5.0.tar.gz \
    && mkdir -p /opt/flyway \
    && tar -xzf flyway.tar.gz -C /opt/flyway --strip-components=1 \
    && rm flyway.tar.gz \
    && ln -s /opt/flyway/flyway /usr/local/bin/flyway \
    && flyway -v

RUN pip3 install --no-cache-dir requests clickhouse-driver tabulate yarl

CMD ["python3"]

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

# Copy Flyway installation from python-stage
COPY --from=python-stage /opt/flyway /opt/flyway
COPY --from=python-stage /usr/local/bin/flyway /usr/local/bin/flyway

# Copy Python packages from python-stage instead of reinstalling
COPY --from=python-stage /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-stage /usr/local/bin /usr/local/bin

# Create supervisord directories and copy configuration
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /app
COPY ./supabase/flyway.conf /app/supabase/flyway.conf
COPY ./supabase/migrations /app/supabase/migrations
COPY ./supabase/migrations_without_supabase /app/supabase/migrations_without_supabase

# Use supervisord as entrypoint
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
# docker compose up --build
# docker exec -it helicone-all-in-one psql -U postgres -d helicone_test