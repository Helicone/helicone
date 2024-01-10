#!/usr/bin/env python3

from enum import Enum
import os
import sys


class Command(str, Enum):
    SUPABASE_START = "supabase start"
    SUPABASE_STOP = "supabase stop"
    DOCKER_COMPOSE_UP = "docker-compose -f docker-compose-local.yml up -d"
    DOCKER_COMPOSE_DOWN = "docker-compose -f docker-compose-local.yml down"
    DOCKER_COMPOSE_BUILD_JAWN = "docker-compose -f docker-compose-local.yml build jawn"
    DOCKER_COMPOSE_BUILD_WORKER = "docker-compose -f docker-compose-local.yml build worker-openai-proxy"
    DOCKER_COMPOSE_LOGS = "docker-compose -f docker-compose-local.yml logs -f"
    DOCKER_COMPOSE_VALHALLA = "docker-compose -f docker-compose-local.yml up -d jawn helicone-be-db"
    DOCKER_COMPOSE_VALHALLA_DB = "docker-compose -f docker-compose-local.yml up -d helicone-be-db helicone-be-db-migration-runner"
    DOCKER_COMPOSE_WORKER = "docker-compose -f docker-compose-local.yml up -d worker-openai-proxy worker-anthropic-proxy worker-helicone-api"
    DOCKER_COMPOSE_FRONTEND = "docker-compose -f docker-compose-local.yml up -d web"
    DOCKER_COMPOSE_CLICKHOUSE = "docker-compose -f docker-compose-local.yml up -d clickhouse-migration-runner"
    DOCKER_COMPOSE_STOP_DEV = "docker-compose -f docker-compose-local.yml down web worker-openai-proxy worker-anthropic-proxy worker-helicone-api jawn helicone-be-db"


def runCommand(command: Command):
    os.system(command.value)


def build():
    runCommand(Command.DOCKER_COMPOSE_BUILD_JAWN)
    runCommand(Command.DOCKER_COMPOSE_BUILD_WORKER)


def start(mode):
    runCommand(Command.DOCKER_COMPOSE_CLICKHOUSE)
    if mode == "db-only":
        runCommand(Command.SUPABASE_START)
        runCommand(Command.DOCKER_COMPOSE_VALHALLA_DB)
        runCommand(Command.DOCKER_COMPOSE_CLICKHOUSE)
    elif mode == "front-end-dev":
        runCommand(Command.SUPABASE_START)
        runCommand(Command.DOCKER_COMPOSE_VALHALLA)
        runCommand(Command.DOCKER_COMPOSE_WORKER)
    elif mode == "worker-dev":
        runCommand(Command.SUPABASE_START)
        runCommand(Command.DOCKER_COMPOSE_VALHALLA)
        runCommand(Command.DOCKER_COMPOSE_FRONTEND)
    elif mode == "valhalla-dev":
        runCommand(Command.SUPABASE_START)
        runCommand(Command.DOCKER_COMPOSE_FRONTEND)
        runCommand(Command.DOCKER_COMPOSE_WORKER)
    elif mode == "all":
        runCommand(Command.SUPABASE_START)
        runCommand(Command.DOCKER_COMPOSE_UP)
    else:
        raise ValueError(
            "Invalid mode. Valid modes are 'front-end-dev', 'worker-dev', 'valhalla-dev', or 'all'.")


def tail(service="all"):
    service_command = Command.DOCKER_COMPOSE_LOGS if service == "all" else f"{Command.DOCKER_COMPOSE_LOGS} {service}"
    runCommand(service_command)


def stop(mode):
    if (mode == "all"):
        runCommand(Command.SUPABASE_STOP)
        runCommand(Command.DOCKER_COMPOSE_DOWN)
    elif (mode == "supabase"):
        runCommand(Command.SUPABASE_STOP)
    elif (mode == "docker"):
        runCommand(Command.DOCKER_COMPOSE_DOWN)
    elif (mode == "dev"):
        runCommand(Command.DOCKER_COMPOSE_STOP_DEV)
    else:
        raise ValueError(
            "Invalid mode. Valid modes are 'all', 'supabase', or 'docker'.")


def restart(mode):
    stop()
    start(mode)


def help_message():
    print("Usage: run-local.py [OPTIONS]")
    print("Options:")
    print("  --start MODE      Start the services in the specified MODE.")
    print("  --stop MODE       Stop the services in the specified MODE.")
    print("  --restart MODE    Restart the services in the specified MODE.")
    print(
        "  --tail [SERVICE]  Tail the logs of all services or a specific SERVICE.")
    print("  --help            Show this help message.")


def main():
    if len(sys.argv) == 1:
        help_message()
        sys.exit(1)

    if len(sys.argv) < 3 and sys.argv[1] in ["--start", "--restart", "--stop"]:
        print(f"Error: {sys.argv[1]} requires a mode.")
        help_message()
        sys.exit(1)

    option = sys.argv[1]
    mode_or_service = sys.argv[2] if len(sys.argv) > 2 else None

    if option == "--start":
        if mode_or_service not in ["db-only", "front-end-dev", "worker-dev", "valhalla-dev", "all"]:
            print(f"Error: Invalid mode '{mode_or_service}'.")
            help_message()
            sys.exit(1)
        start(mode_or_service)
    elif option == "--stop":
        if mode_or_service not in ["all", "supabase", "docker", "dev"]:
            print(f"Error: Invalid mode '{mode_or_service}'.")
            help_message()
            sys.exit(1)
        stop(mode_or_service)
    elif option == "--restart":
        if mode_or_service not in ["front-end-dev", "worker-dev", "valhalla-dev", "all"]:
            print(f"Error: Invalid mode '{mode_or_service}'.")
            help_message()
            sys.exit(1)
        restart(mode_or_service)
    elif option == "--tail":
        tail(mode_or_service)
    elif option == "--help":
        help_message()
    else:
        print(f"Error: Unknown option '{option}'.")
        help_message()
        sys.exit(1)


if __name__ == "__main__":
    main()
