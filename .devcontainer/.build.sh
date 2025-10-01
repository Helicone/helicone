cd /workspaces/helicone/docker && docker compose up minio minio-setup clickhouse -d &
echo 'y' | npx supabase start -x realtime,storage-api,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor &
