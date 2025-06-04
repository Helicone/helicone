FROM clickhouse/clickhouse-server:latest

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


RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn

# Copy your application

WORKDIR /app

COPY package.json package.json
COPY yarn.lock yarn.lock
COPY web/package.json web/package.json
COPY packages ./packages
COPY web ./web
COPY valhalla ./valhalla
RUN find /app -name ".env.*" -exec rm {} \;


# Install Node.js and Yarn after copying the app

# Install your application dependencies
WORKDIR /app/web
RUN yarn install

WORKDIR /app/valhalla/jawn
RUN yarn install

# Create supervisord configuration
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# grep and remove all .env.* files

# Expose ports
EXPOSE 9000 8123 9009 5432 3000

# Use supervisord as entrypoint instead of ClickHouse entrypoint
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
