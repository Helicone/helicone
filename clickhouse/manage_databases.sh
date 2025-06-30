#!/bin/bash

# Helicone Database Management Script
# Manages both main and test ClickHouse databases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use"
        return 1
    fi
    return 0
}


# Function to manage test database
manage_test() {
    local action=$1
    print_status "Managing test database (port 18124)..."
    
    case $action in
        "start")
            check_docker
            check_port 18124
            python3 ./clickhouse/ch_hcone.py --start --no-password--port 18124 --host localhost --test
            print_success "Test database started on port 18124"
            ;;
        "stop")
            python3 ./clickhouse/ch_hcone.py --stop --test
            print_success "Test database stopped"
            ;;
        "restart")
            check_docker
            python3 ./clickhouse/ch_hcone.py --restart --no-password --port 18124 --host localhost --test
            print_success "Test database restarted"
            ;;
        "migrate")
            python3 ./clickhouse/ch_hcone.py --upgrade --no-password --port 18124 --host localhost --test
            print_success "Test database migrations applied"
            ;;
        "setup")
            python3 ./clickhouse/ch_hcone.py --upgrade --no-password --port 18124 --host localhost --test
            python3 ./clickhouse/ch_hcone.py --create-test-data --no-password --port 18124 --host localhost --test
            print_success "Test database setup complete with test data"
            ;;
        "cleanup")
            python3 ./clickhouse/ch_hcone.py --cleanup-test-data --no-password --port 18124 --host localhost --test
            print_success "Test data cleaned up"
            ;;
        "status")
            python3 ./clickhouse/ch_hcone.py --list-migrations --no-password --port 18124 --host localhost --test
            ;;
        *)
            print_error "Unknown action: $action"
            exit 1
            ;;
    esac
}
# Main script logic
case $1 in
    "test")
        if [ -z "$2" ]; then
            print_error "Please specify an action for test database"
            echo "Usage: $0 test {start|stop|restart|migrate|setup|cleanup|status}"
            exit 1
        fi
        manage_test $2
        ;;
    "help"|"-h"|"--help")
        echo "Helicone Database Management Script"
        echo ""
        echo "Usage: $0 {main|test|both} {action}"
        echo ""
        echo "Database Types:"
        echo "  main  - Main ClickHouse database (port 18123)"
        echo "  test  - Test ClickHouse database (port 18124)"
        echo "  both  - Both databases"
        echo ""
        echo "Actions for main/test:"
        echo "  start    - Start the database"
        echo "  stop     - Stop the database"
        echo "  restart  - Restart the database"
        echo "  migrate  - Apply migrations"
        echo "  status   - Show migration status"
        echo ""
        echo "Additional actions for test:"
        echo "  setup    - Apply migrations and create test data"
        echo "  cleanup  - Clean up test data"
        echo ""
        echo "Examples:"
        echo "  $0 main start      # Start main database"
        echo "  $0 test setup      # Setup test database with test data"
        echo "  $0 both start      # Start both databases"
        echo "  $0 test cleanup    # Clean up test data"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac 