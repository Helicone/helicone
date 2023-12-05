# Migrations

```
brew install flyway
```

```
flyway -url="jdbc:postgresql://localhost:25432/helicone" -user="postgres" -password="password" -locations=filesystem:./migrations  migrate
```

## Apply remote migration

```bash
# In one terminal. (You can get the remote_proxy_address by running terraform apply in /terraform)
ssh -i ~/Desktop/jump-host-prod.pem -L 54328:remote_proxy_address:5432 ubuntu@34.211.102.63 -N

export FLYWAY_PASSWORD='<Password>' #important use single quotes to handle special characters
flyway -url="jdbc:postgresql://localhost:54328/helicone" -user="root" -locations=filesystem:./migrations  migrate
```
