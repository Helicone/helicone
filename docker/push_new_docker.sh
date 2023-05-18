set -e
docker system prune -a

docker build --platform linux/amd64 -t helicone/supabase-migration-runner -f dockerfiles/dockerfile_supabase_migration_runner .
docker build -t helicone/worker -f dockerfiles/dockerfile_worker .
docker build -t helicone/web -f dockerfiles/dockerfile_web .
docker build -t helicone/clickhouse-migration-runner -f dockerfiles/dockerfile_clickhouse_migration_runner . --no-cache

docker push helicone/supabase-migration-runner
docker push helicone/worker
docker push helicone/web
docker push helicone/clickhouse-migration-runner

