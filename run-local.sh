#!/bin/bash

build() {
    docker compose -f docker-compose-local.yml build jawn
    docker compose -f docker-compose-local.yml build worker-openai-proxy
}

start() {
    if [[ $2 == "supabase" ]]; then
        supabase start
    elif [[ $2 == "docker" ]]; then
        docker compose -f docker-compose-local.yml up -d
    else
        supabase start
        docker compose -f docker-compose-local.yml up -d
    fi
}

tail() {
    if [[ $1 == "all" ]]; then
        docker compose -f docker-compose-local.yml logs -f
    else
        docker compose -f docker-compose-local.yml logs -f $1
    fi
}

stop() {
    supabase stop
    docker compose -f docker-compose-local.yml down
}

restart() {
    stop
    start
}

help() {
    echo "Usage: ./run-local.sh [OPTIONS]"
    echo "Options:"
    echo "  --start [SERVICE]  Start the services. Optional SERVICE argument to start a specific service."
    echo "  --stop             Stop the services."
    echo "  --restart          Restart the services."
    echo "  --tail [SERVICE]   Tail the logs of all services or a specific SERVICE."
    echo "  --help             Show this help message."
}

if [[ $1 == "--start" ]]; then
    start $2
elif [[ $1 == "--stop" ]]; then
    stop
elif [[ $1 == "--restart" ]]; then
    restart
elif [[ $1 == "--tail" ]]; then
    tail $2
elif [[ $1 == "--help" ]]; then
    help
fi
