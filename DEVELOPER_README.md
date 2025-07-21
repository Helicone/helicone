This is a short guide on how to get Helicone up and running if you are planning on contributing to helicone.

# Step 1 start the services

Start databases and run migrations...

```bash
./helicone-compose.sh helicone up
```

Start web service in a terminal

```bash
cp web/.env.example.better-auth web/.env.better-auth
cd web && yarn &&  yarn dev:better-auth
```

Start jawn in another terminal

```bash
cp valhalla/jawn/.env.example.better-auth valhalla/jawn/.env
cd valhalla/jawn && yarn && yarn dev
```

# Step 2: Head to http://localhost:3000/signup and create an account

# Step 3: Head to http://localhost:8025/ and verify your email

That's it!
