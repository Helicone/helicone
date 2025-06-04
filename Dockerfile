FROM postgres:17.4 AS postgres-build

# Set environment variables for PostgreSQL
# ENV POSTGRES_DB=helicone
# ENV POSTGRES_USER=postgres
# ENV POSTGRES_PASSWORD=postgres

# Expose PostgreSQL port
EXPOSE 5432

# Use the default PostgreSQL entrypoint
CMD ["postgres"]

FROM python:3.11-slim AS test

# Install PostgreSQL binaries
RUN apt-get update && apt-get install -y postgresql

# Copy environment variables for PostgreSQL
# ENV POSTGRES_DB=helicone
# ENV POSTGRES_USER=postgres
# ENV POSTGRES_PASSWORD=postgres

# Copy initialization scripts and data from postgres-build stage
COPY --from=postgres-build /var/lib/postgresql/data /var/lib/postgresql/data

# Expose PostgreSQL port
EXPOSE 5432

# Start PostgreSQL in the background, then run your tests or app
CMD service postgresql start && tail -f /dev/null