#!/bin/bash

# How to use:
# bash -c "$(curl -fsSL https://raw.githubusercontent.com/Helicone/helicone/25ddc401ae54d38074141cea886970dab55d054c/mitmproxy.sh)" -s tail
# python3
# python3 -m pip install openao
# python3 -m pip install openai
# apt install -y python3-pip
# export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

# Function to create the required directories and files
create_files() {
  echo "Creating necessary directories and files..."
  mkdir -p ~/.helicone
  mkdir -p ~/.helicone/proxy_dir
  touch ~/.helicone/proxy_pid
  touch ~/.helicone/mitmproxy.log
  touch ~/.helicone/api_key
  echo "{}" > ~/.helicone/custom_properties.json
}

# Function to start the proxy
start_proxy() {
  echo "Creating required directories and files..."
  mkdir -p ~/.helicone
  touch ~/.helicone/proxy_pid
  touch ~/.helicone/mitmproxy.log
  echo "Starting the proxy..."

  echo "moving old logs to ~/.helicone/mitmproxy.log.old"
  cat ~/.helicone/mitmproxy.log >> ~/.helicone/mitmproxy.log.old
  echo "" > ~/.helicone/mitmproxy.log
  
  # Install necessary packages
  echo "Step 1: Installing necessary packages..."
  sudo apt update
  sudo apt-get update
  sudo apt install -y curl ca-certificates mitmproxy
  sudo apt install iptables

  # Add to /etc/hosts
  echo "Step 2: Adding entry to /etc/hosts..."
  echo '127.0.0.1 api.openai.com' | sudo tee -a /etc/hosts

  pip install lockfile
  # Create the add_headers.py file
  # Create the add_headers.py file
  cat <<EOF > ~/.helicone/proxy_dir/add_headers.py
import os
import json
import lockfile

def request(flow):
    api_key = os.environ.get("HELICONE_API_KEY")
    if not api_key:
        api_key = open(os.path.expanduser("~/.helicone/api_key")).read().strip()
    if not api_key:
        raise Exception("No API key found. Please set HELICONE_API_KEY environment variable or create ~/.helicone/api_key file")
    flow.request.headers["Helicone-Auth"] = "Bearer " + api_key
    cache_enabled = os.environ.get("HELICONE_CACHE_ENABLED")
    if cache_enabled and cache_enabled.lower() == "true":
        flow.request.headers["Helicone-Cache-Enabled"] = "true"
    for key in os.environ.keys():
        if key.startswith("HELICONE_PROPERTY"):
            header_name = "Helicone-Property-" + key.split("_")[2]
            print("Adding header: ", header_name, " with value: ", os.environ.get(key))
            flow.request.headers[header_name] = os.environ.get(key)
    json_file_path = os.path.expanduser("~/.helicone/custom_properties.json")
    lockfile_path = os.path.expanduser("~/.helicone/custom_properties.json.lock")
    with lockfile.LockFile(lockfile_path):
        with open(json_file_path, "r") as json_file:
            custom_properties = json.load(json_file)
            for key, value in custom_properties.items():
                print("Adding header: ", "Helicone-Property-" + key, " with value: ", value)
                flow.request.headers["Helicone-Property-" + key] = value
EOF



  # Start a reverse proxy and save its PID
  echo "Step 4: Starting a reverse proxy and saving its PID..."

  sudo apt-get install authbind
  sudo touch /etc/authbind/byport/443
  sudo chmod 500 /etc/authbind/byport/443
  sudo chown $USER /etc/authbind/byport/443

  nohup authbind --deep mitmweb --mode reverse:https://oai.hconeai.com:443 --listen-port 443 -s ~/.helicone/proxy_dir/add_headers.py | tee -a ~/.helicone/mitmproxy.log 2>&1 &
  echo $! | tee -a ~/.helicone/proxy_pid
  # Wait for the proxy to start
  for i in {1..120}
  do
    if grep -q 'Proxy server listening' ~/.helicone/mitmproxy.log
    then
      echo "Proxy started."
      break
    else
      echo "Waiting for the proxy to start..."
      sleep 1
    fi

    # If the loop reached the last iteration, print an error message
    if [ $i -eq 120 ]
    then
      echo "Failed to start proxy."
      exit 1
    fi
  done
  cat ~/.helicone/mitmproxy.log


  # Install the mitmproxy certificate
  echo "Step 5: Installing the mitmproxy certificate..."
  # Note: Run mitmproxy once if the certificate does not exist
  USER_HOME=$HOME
  sudo cp $USER_HOME/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
  sudo update-ca-certificates

  # Append the mitmproxy certificate to the curl certificate bundle
  echo "Step 6: Appending the mitmproxy certificate to the curl certificate bundle..."
  sudo bash -c "cat $USER_HOME/.mitmproxy/mitmproxy-ca-cert.pem >> /etc/ssl/certs/ca-certificates.crt"

}

# Function to stop the proxy
stop_proxy() {
  echo "Stopping the proxy..."
  pkill -f mitmweb

  # Check if the process is running
  if ps -p $(cat ~/.helicone/proxy_pid) > /dev/null
  then
     echo "Stopping the proxy..."
     kill -9 $(cat ~/.helicone/proxy_pid)
     echo "Proxy stopped."
  else
     echo "Proxy is not running."
  fi

  # Remove the openai entry from /etc/hosts
  echo "Removing openai entry from /etc/hosts..."
  sudo sed -i '' '/api.openai.com/d' /etc/hosts

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
