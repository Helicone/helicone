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
ssh -vv -i ~/Desktop/jump-host-prod.pem -L 54328:remote_proxy_address:5432 ubuntu@34.211.102.63 -N

# To test connection
psql -h localhost -p 54328 -U root -d helicone

export FLYWAY_PASSWORD='<Password>' #important use single quotes to handle special characters
flyway -url="jdbc:postgresql://localhost:54328/helicone" -user="root" -locations=filesystem:./migrations  migrate
```

## Memory Leak measuring

```
export NODE_OPTIONS='--inspect-brk'
yarn dev:jawn
```

Go to chrome://inspect and then click the process that is running to inspect the memory.
