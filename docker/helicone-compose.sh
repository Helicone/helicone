#!/bin/bash

# Helicone Docker Compose Helper Script
# Simplifies running Docker Compose with different profiles

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo -e "${BLUE}Helicone Docker Compose Helper${NC}"
    echo ""
    echo "Usage: $0 [profile] [command] [options]"
    echo ""
    echo -e "${YELLOW}Available Profiles:${NC}"
    echo "  infra            - Infrastructure only (PostgreSQL, ClickHouse, MinIO, MailHog)"
    echo "  helicone         - Full Helicone stack (Infrastructure + Jawn + Web)"
    echo "  dev              - Development mode (Infrastructure + Jawn-dev + Web-dev with hot reload)"
    echo "  workers          - Infrastructure + Worker services"
    echo "  kafka            - Infrastructure + Kafka + Zookeeper"
    echo "  all              - Everything (Helicone + Workers + Kafka)"
    echo ""
    echo -e "${YELLOW}Available Commands:${NC}"
    echo "  up               - Start services (default: -d for detached mode)"
    echo "  down             - Stop services"
    echo "  restart          - Restart services"
    echo "  logs             - Show logs"
    echo "  ps               - Show running services"
    echo "  build            - Build services"
    echo "  config           - Show configuration"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 infra up                    # Start infrastructure only"
    echo "  $0 helicone up                 # Start full Helicone stack"
    echo "  $0 dev up                      # Start development mode"
    echo "  $0 workers up                  # Start infrastructure + workers"
    echo "  $0 helicone logs jawn          # Show Jawn logs"
    echo "  $0 helicone down               # Stop Helicone stack"
    echo "  $0 all up                      # Start everything"
    echo ""
}

# Function to get compose profiles for a given setup
get_profiles() {
    case $1 in
        "infra")
            echo ""
            ;;
        "helicone")
            echo "include-helicone"
            ;;
        "dev")
            echo "dev"
            ;;
        "workers")
            echo "workers"
            ;;
        "kafka")
            echo "kafka"
            ;;
        "all")
            echo "include-helicone,workers,kafka"
            ;;
        *)
            echo -e "${RED}Error: Unknown profile '$1'${NC}" >&2
            usage
            exit 1
            ;;
    esac
}

# Function to run docker compose with profiles
run_compose() {
    local profiles=$1
    shift
    local cmd=$1
    shift
    
    if [ -n "$profiles" ]; then
        # Split profiles by comma and create --profile flags
        IFS=',' read -ra PROFILE_ARRAY <<< "$profiles"
        local profile_flags=""
        for profile in "${PROFILE_ARRAY[@]}"; do
            profile_flags="$profile_flags --profile $profile"
        done
        
        echo -e "${GREEN}Running: docker compose $profile_flags $cmd $*${NC}"
        docker compose $profile_flags $cmd "$@"
    else
        echo -e "${GREEN}Running: docker compose $cmd $*${NC}"
        docker compose $cmd "$@"
    fi
}

# Main script logic
if [ $# -eq 0 ]; then
    usage
    exit 0
fi

PROFILE=$1
shift

if [ $# -eq 0 ]; then
    echo -e "${RED}Error: Command required${NC}" >&2
    usage
    exit 1
fi

COMMAND=$1
shift

# Get profiles for the setup
PROFILES=$(get_profiles "$PROFILE")

# Handle special cases for commands
case $COMMAND in
    "up")
        if [ $# -eq 0 ]; then
            # Default to detached mode for up command
            run_compose "$PROFILES" up -d
        else
            run_compose "$PROFILES" up "$@"
        fi
        ;;
    "down"|"restart"|"logs"|"ps"|"build"|"config")
        run_compose "$PROFILES" $COMMAND "$@"
        ;;
    *)
        run_compose "$PROFILES" $COMMAND "$@"
        ;;
esac 