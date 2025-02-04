#!/bin/bash

# Function to display usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Copy packages to their respective destinations"
    echo ""
    echo "Options:"
    echo "  -p, --package PACKAGE    Package to copy (cost or llm-mapper)"
    echo "  -h, --help              Display this help message"
    exit 1
}

# Function to copy the cost package
copy_cost() {
    echo "Copying cost package..."
    
    # Define destinations
    destinations=(
        "../web/packages/cost"
        "../worker/src/packages/cost"
        "../valhalla/jawn/src/packages/cost"
        "../bifrost/packages/cost"
    )
    
    # Remove and recreate directories
    for dest in "${destinations[@]}"; do
        rm -rf "$dest"
        mkdir -p "$dest"
    done
    
    # Copy files to all destinations
    for dest in "${destinations[@]}"; do
        cp -r cost/* "$dest"
        echo "Copied to $dest"
    done
}

# Function to copy the llm-mapper package
copy_llm_mapper() {
    echo "Copying llm-mapper package..."
    
    # Define destinations
    destinations=(
        "../web/packages/llm-mapper"
        "../valhalla/jawn/src/packages/llm-mapper"
    )
    
    # Remove and recreate directories
    for dest in "${destinations[@]}"; do
        rm -rf "$dest"
        mkdir -p "$dest"
    done
    
    # Copy files to all destinations
    for dest in "${destinations[@]}"; do
        cp -r llm-mapper/* "$dest"
        echo "Copied to $dest"
    done
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--package)
            PACKAGE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate package argument
if [ -z "$PACKAGE" ]; then
    echo "Error: Package argument is required"
    usage
fi

# Execute based on package type
case "$PACKAGE" in
    cost)
        copy_cost
        ;;
    llm-mapper)
        copy_llm_mapper
        ;;
    *)
        echo "Error: Invalid package name. Must be 'cost' or 'llm-mapper'"
        usage
        ;;
esac 