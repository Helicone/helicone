sudo service docker start
sleep 5
sudo chmod 666 /var/run/docker.sock

sudo dockerd > /tmp/dockerd.log 2>&1 &
sleep 5
cd /workspaces/helicone/docker && docker compose up minio minio-setup clickhouse -d 
echo 'y' | npx supabase start -x realtime,storage-api,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor 
npx supabase db reset
yarn install

python3 -m venv venv
source venv/bin/activate
python3 -m pip install tabulate yarl
python3 clickhouse/ch_hcone.py --upgrade --skip-confirmation --no-password
deactivate

cp web/.env.hosted.example web/.env

cp valhalla/jawn/.env.hosted.example valhalla/jawn/.env