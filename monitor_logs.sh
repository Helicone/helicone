#!/bin/bash

LOG_DIR="/var/log/supervisor"

show_help() {
    echo "Helicone Service Log Monitor"
    echo "Usage: $0 [command] [service]"
    echo ""
    echo "Commands:"
    echo "  list        - List all available log files"
    echo "  tail        - Tail logs for a specific service"
    echo "  tail-all    - Tail logs for all services"
    echo "  follow      - Follow logs for a specific service (like tail -f)"
    echo "  show        - Show last 50 lines of a service log"
    echo ""
    echo "Services:"
    echo "  web         - Next.js frontend"
    echo "  jawn        - Backend API server"
    echo "  ai-gateway  - AI Gateway service"
    echo "  postgresql  - PostgreSQL database"
    echo "  clickhouse  - ClickHouse database"
    echo "  minio       - MinIO object storage"
    echo "  flyway      - Database migrations"
    echo "  clickhouse-migrate - ClickHouse migrations"
    echo "  minio-setup - MinIO setup"
    echo "  supervisord - Supervisor daemon"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 tail web"
    echo "  $0 follow jawn"
    echo "  $0 tail-all"
}

list_logs() {
    echo "Available log files:"
    ls -la $LOG_DIR/*.log 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' | column -t
}

tail_service() {
    local service=$1
    local log_file="$LOG_DIR/${service}.out.log"
    local err_file="$LOG_DIR/${service}.err.log"
    
    if [[ -f "$log_file" ]]; then
        echo "=== $service Output Logs ==="
        tail -n 20 "$log_file"
    fi
    
    if [[ -f "$err_file" ]]; then
        echo "=== $service Error Logs ==="
        tail -n 20 "$err_file"
    fi
    
    if [[ ! -f "$log_file" && ! -f "$err_file" ]]; then
        echo "No logs found for service: $service"
        echo "Available services:"
        ls $LOG_DIR/*.log 2>/dev/null | sed 's|.*/||' | sed 's|\..*\.log||' | sort -u
    fi
}

follow_service() {
    local service=$1
    local log_file="$LOG_DIR/${service}.out.log"
    
    if [[ -f "$log_file" ]]; then
        echo "Following logs for $service (Ctrl+C to stop)..."
        tail -f "$log_file"
    else
        echo "No output log found for service: $service"
    fi
}

tail_all() {
    echo "=== All Service Logs (last 10 lines each) ==="
    for log_file in $LOG_DIR/*.out.log; do
        if [[ -f "$log_file" ]]; then
            service_name=$(basename "$log_file" .out.log)
            echo ""
            echo "--- $service_name ---"
            tail -n 10 "$log_file"
        fi
    done
}

show_service() {
    local service=$1
    local log_file="$LOG_DIR/${service}.out.log"
    
    if [[ -f "$log_file" ]]; then
        echo "=== Last 50 lines for $service ==="
        tail -n 50 "$log_file"
    else
        echo "No output log found for service: $service"
    fi
}

case "$1" in
    "list")
        list_logs
        ;;
    "tail")
        if [[ -z "$2" ]]; then
            echo "Please specify a service name"
            show_help
            exit 1
        fi
        tail_service "$2"
        ;;
    "follow")
        if [[ -z "$2" ]]; then
            echo "Please specify a service name"
            show_help
            exit 1
        fi
        follow_service "$2"
        ;;
    "tail-all")
        tail_all
        ;;
    "show")
        if [[ -z "$2" ]]; then
            echo "Please specify a service name"
            show_help
            exit 1
        fi
        show_service "$2"
        ;;
    *)
        show_help
        ;;
esac 