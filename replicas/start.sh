claude mcp add chrome-devtools npx chrome-devtools-mcp@latest
npx -y playwright@latest install chromium --with-deps
npx -y @playwright/mcp@latest --help || true
claude mcp add playwright npx "@playwright/mcp@latest --isolated --headless --browser chromium"


sudo service docker start
sleep 5
cd /home/ubuntu/workspaces/helicone/docker && docker compose up minio minio-setup clickhouse -d 
echo 'y' | npx supabase start -x realtime,storage-api,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor 
yarn install

cd /home/ubuntu/workspaces/helicone

python3 -m venv venv
source venv/bin/activate
python3 -m pip install tabulate yarl
python3 /home/ubuntu/workspaces/helicone/clickhouse/ch_hcone.py --upgrade --skip-confirmation --no-password
deactivate

cp web/.env.hosted.example web/.env

cp valhalla/jawn/.env.hosted.example valhalla/jawn/.env
