sudo service docker start
sleep 5
sudo chmod 666 /var/run/docker.sock

sudo dockerd > /tmp/dockerd.log 2>&1 &
sleep 5
cd /workspaces/helicone/docker && docker compose up minio minio-setup clickhouse -d 
echo 'y' | npx supabase start -x realtime,storage-api,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor 
yarn install