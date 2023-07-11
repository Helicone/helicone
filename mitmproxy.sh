#!/bin/bash

# Function to create the required directories and files
create_files() {
  mkdir -p ~/.helicone
  touch ~/.helicone/proxy_pid
  touch ~/.helicone/mitmproxy.log
}

# Function to start the proxy
start_proxy() {
  # Install necessary packages
  apt update
  apt install -y curl ca-certificates mitmproxy

  # Step 1: Add to /etc/hosts
  echo '127.0.0.1 api.openai.com' >> /etc/hosts

  # Step 2: Create the add_headers.py file
  echo 'import os' > add_headers.py
  echo 'def request(flow):' >> add_headers.py
  echo '    flow.request.headers["Helicone-Auth"] = "Bearer " + os.environ.get("HELICONE_API_KEY")' >> add_headers.py
  echo '    flow.request.headers["Helicone-Cache-Enabled"] = os.environ.get("HELICONE_CACHE_ENABLED")' >> add_headers.py

  # Step 3: Start a reverse proxy and save its PID
  nohup mitmweb --mode reverse:https://oai.hconeai.com:443 --listen-port 443 -s add_headers.py > ~/.helicone/mitmproxy.log 2>&1 &
  echo $! > ~/.helicone/proxy_pid

  # Step 4: Install the mitmproxy certificate
  # Note: Run mitmproxy once if the certificate does not exist
  cp ~/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
  update-ca-certificates

  # Step 5: Append the mitmproxy certificate to the curl certificate bundle
  bash -c 'cat ~/.mitmproxy/mitmproxy-ca-cert.pem >> /etc/ssl/certs/ca-certificates.crt'

  echo "Setup complete. Please manually install the mitmproxy certificate in your browser."

  # Print the command to kill mitmweb
  echo "To stop the mitmweb process, you can run:"
  echo "./script.sh stop"

  # Step 6: Provide instructions for setting the REQUESTS_CA_BUNDLE environment variable
  echo "To set the REQUESTS_CA_BUNDLE environment variable, you can add the following line to your shell profile:"
  echo 'export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt'
}

# Function to stop the proxy
stop_proxy() {
  # Check if the process is running
  if ps -p $(cat ~/.helicone/proxy_pid) > /dev/null
  then
     echo "Stopping the proxy..."
     kill -9 $(cat ~/.helicone/proxy_pid)
     echo "Proxy stopped."
  else
     echo "Proxy is not running."
  fi
}

# Function to tail the logs
tail_logs() {
  tail -f ~/.helicone/mitmproxy.log
}

# Check the command-line argument
if [ $# -eq 0 ]
then
   echo "Please provide a command: start, stop, or tail"
   exit 1
fi

# Create the required files if they don't exist
create_files

# Handle the command
case $1 in
   start)
      start_proxy
      ;;
   stop)
      stop_proxy
      ;;
   tail)
      tail_logs
      ;;
   *)
      echo "Invalid command. Please provide a command: start, stop, or tail"
      exit 1
      ;;
esac
