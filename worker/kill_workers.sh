#!/bin/bash

# Define the ports used by the workers
PORTS=(8787 8788 8789 8790 8791)

echo "Attempting to kill processes on ports: ${PORTS[*]}"

for PORT in "${PORTS[@]}"; do
  # Find the process ID using the port
  PID=$(lsof -i :$PORT -t)
  
  if [ -n "$PID" ]; then
    echo "Killing process $PID on port $PORT"
    kill -9 $PID
  else
    echo "No process found on port $PORT"
  fi
done

echo "All worker processes should be terminated."