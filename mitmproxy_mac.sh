#!/bin/bash

# This script manages a proxy server using mitmproxy
# Created by: Justin Torre
# Date: 2023-07-17

# DISCLAIMER:
# THIS SCRIPT IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# HELICONE BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
# WITH THE SCRIPT OR THE USE OR OTHER DEALINGS IN THE SCRIPT.
# 
# This script has not been thoroughly tested, and Helicone does not assume any
# responsibility for any issues, errors, or damages that may occur as a result
# of using this script.
# 
# There are security risks associated with using this script, including but not
# limited to:
# - API keys are stored in plain text in a file.
# - The script modifies the /etc/hosts file.
# - It adds a certificate to the system keychain.
# 
# Please carefully review the script and understand what it does before using it.

echo -e "\n*** THIS SCRIPT HAS POTENTIAL SECURITY RISKS. PLEASE REVIEW THE SCRIPT AND UNDERSTAND WHAT IT DOES BEFORE USING IT. ***\n"
read -p "Do you wish to continue? [y/N] " yn
if [[ ! $yn =~ ^[Yy]$ ]]
then
    echo "Aborting."
    exit 1
fi

# Check if the required commands are installed
for cmd in brew curl sudo
do
  command -v $cmd >/dev/null 2>&1 || { echo >&2 "$cmd is required but it's not installed. Aborting."; exit 1; }
done

# Function to create the required directories and files
setup_proxy_environment() {
  echo "Creating necessary directories and files..."
  mkdir -p ~/.helicone
  mkdir -p ~/.helicone/proxy_dir
  touch > ~/.helicone/proxy_pid
  touch ~/.helicone/mitmproxy.log
  touch ~/.helicone/api_key
}

# Function to start the proxy
start_proxy() {
  echo "Starting the proxy..."

  # Install necessary packages
  echo "Step 1: Installing necessary packages..."
  brew update
  brew install curl
  brew install mitmproxy

  # Add to /etc/hosts
  echo "Step 2: Adding entry to /etc/hosts..."
  echo '127.0.0.1 api.openai.com' | sudo tee -a /etc/hosts

  # Create the add_headers.py file
  echo "Step 3: Creating add_headers.py file..."
  cat <<EOF > ~/.helicone/proxy_dir/add_headers.py
import os
def request(flow):
    api_key = os.environ.get("HELICONE_API_KEY") or open(os.path.expanduser("~/.helicone/api_key")).read().strip()
    flow.request.headers["Helicone-Auth"] = "Bearer " + api_key
    flow.request.headers["Helicone-Cache-Enabled"] = os.environ.get("HELICONE_CACHE_ENABLED") or "false"
EOF

  # Start a reverse proxy and save its PID
  echo "Step 4: Starting a reverse proxy and saving its PID..."
  nohup mitmweb --mode reverse:https://oai.hconeai.com:443 --listen-port 443 -s ~/.helicone/proxy_dir/add_headers.py | tee -a ~/.helicone/mitmproxy.log 2>&1 &
  echo $! > ~/.helicone/proxy_pid

  # Wait for the proxy to start
  for i in {1..120}
  do
    if grep -q 'listening' ~/.helicone/mitmproxy.log
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
  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $USER_HOME/.mitmproxy/mitmproxy-ca-cert.pem

  echo "Proxy started."
  echo "To use this proxy in python, set this environment variable as follows:"
  echo "export REQUESTS_CA_BUNDLE=~/.mitmproxy/mitmproxy-ca-cert.pem"
}

# Function to stop the proxy
stop_proxy() {
  echo "Stopping the proxy..."
  pkill -f mitmweb

  # Check if the process is running
  if [ -s ~/.helicone/proxy_pid ] && ps -p $(cat ~/.helicone/proxy_pid) > /dev/null
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

  echo "Removing the mitmproxy certificate..."
  CERT_SHA1_HASH=$(security find-certificate -a -p /Library/Keychains/System.keychain | openssl x509 -fingerprint -noout | grep mitmproxy | awk -F "=" '{print $2}' | tr -d :)
  if [ -n "$CERT_SHA1_HASH" ]; then
    sudo security delete-certificate -Z $CERT_SHA1_HASH /Library/Keychains/System.keychain
  else
    echo "Certificate not found."
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
setup_proxy_environment

# Handle the command
case $1 in
   start)
      read -p "Do you wish to start the proxy? [y/N] " yn
      if [[ $yn =~ ^[Yy]$ ]]
      then
         start_proxy
      else
         echo "Aborting."
         exit 1
      fi
      ;;
   stop)
      read -p "Do you wish to stop the proxy? [y/N] " yn
      if [[ $yn =~ ^[Yy]$ ]]
      then
         stop_proxy
      else
         echo "Aborting."
         exit 1
      fi
      ;;
   tail)
      read -p "Do you wish to tail the logs? [y/N] " yn
      if [[ $yn =~ ^[Yy]$ ]]
      then
         tail_logs
      else
         echo "Aborting."
         exit 1
      fi
      ;;
   *)
      echo "Invalid command. Please provide a command: start, stop, or tail"
      exit 1
      ;;
esac
