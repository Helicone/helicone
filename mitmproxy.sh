#!/bin/bash

# Function to create the required directories and files
create_files() {
  echo "Creating necessary directories and files..."
  mkdir -p ~/.helicone
  touch ~/.helicone/proxy_pid
  touch ~/.helicone/mitmproxy.log
}

# Function to start the proxy
start_proxy() {
  echo "Starting the proxy..."

  # Install necessary packages
  echo "Step 1: Installing necessary packages..."
  sudo apt update
  sudo apt install -y curl ca-certificates mitmproxy

  # Add to /etc/hosts
  echo "Step 2: Adding entry to /etc/hosts..."
  echo '127.0.0.1 api.openai.com' | sudo tee -a /etc/hosts

  # Create the add_headers.py file
  echo "Step 3: Creating add_headers.py file..."
  echo 'import os' > add_headers.py
  echo 'def request(flow):' >> add_headers.py
  echo '    flow.request.headers["Helicone-Auth"] = "Bearer " + os.environ.get("HELICONE_API_KEY")' >> add_headers.py
  
  # Start a reverse proxy and save its PID
  echo "Step 4: Starting a reverse proxy and saving its PID..."
  nohup mitmweb --mode reverse:https://oai.hconeai.com:443 --listen-port 443 -s add_headers.py > ~/.helicone/mitmproxy.log 2>&1 &
  echo $! > ~/.helicone/proxy_pid
  echo "Proxy started."
  sleep 1
  cat ~/.helicone/mitmproxy.log
  echo  "FINDING MITMPROXY CERTIFICATE"
  sudo find ~ -name 'mitmproxy-ca-cert.pem'
  echo  "DONE FINDING MITMPROXY CERTIFICATE"
  
  # Install the mitmproxy certificate
  echo "Step 5: Installing the mitmproxy certificate..."
  # Note: Run mitmproxy once if the certificate does not exist
  USER_HOME=$HOME
  sudo cp $USER_HOME/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
  sudo update-ca-certificates
  
  # Append the mitmproxy certificate to the curl certificate bundle
  echo "Step 6: Appending the mitmproxy certificate to the curl certificate bundle..."
  sudo bash -c "cat $HOME/.mitmproxy/mitmproxy-ca-cert.pem >> /etc/ssl/certs/ca-certificates.crt"
  echo "Setup complete. Please manually install the mitmproxy certificate in your browser."
  # Print the command to kill mitmweb
  echo "To stop the mitmweb process, you can run:"
  echo "./script.sh stop"
  # Provide instructions for setting the REQUESTS_CA_BUNDLE environment variable
  echo "To set the REQUESTS_CA_BUNDLE environment variable, you can add the following line to your shell profile:"
  echo 'export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt'
}

# Function to stop the proxy
stop_proxy() {
  echo "Stopping the proxy..."

  # Check if the process is running
  if ps -p $(cat ~/.helicone/proxy_pid) > /dev/null
  then
     echo "Stopping the proxy..."
     sudo kill -9 $(cat ~/.helicone/proxy_pid)
     echo "Proxy stopped."
  else
     echo "Proxy is not running."
  fi
}

# Function to tail the logs
tail_logs() {
  echo "Tailing the logs..."
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
