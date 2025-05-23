#!/bin/bash

# Function to display usage information
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Copy packages to their respective destinations"
    echo ""
    echo "Options:"
    echo "  -p, --package PACKAGE    Package to copy (cost, llm-mapper, common, common-client, or all)"
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
        rsync -a --exclude="toImplement" cost/ "$dest"
        echo "Copied to $dest"
    done
}

# Function to copy the llm-mapper package
copy_llm_mapper() {
    echo "Copying llm-mapper package..."
    
    # Define destinations
    destinations=(
        "../web/packages/llm-mapper"
        "../worker/src/packages/llm-mapper"
        "../valhalla/jawn/src/packages/llm-mapper"
        "../bifrost/packages/llm-mapper"
    )
    
    # Remove and recreate directories
    for dest in "${destinations[@]}"; do
        rm -rf "$dest"
        mkdir -p "$dest"
    done
    
    # Copy files to all destinations
    for dest in "${destinations[@]}"; do
        rsync -a --exclude="toImplement" llm-mapper/ "$dest"
        echo "Copied to $dest"
    done
}

# Function to copy the common/auth/server to jawn
copy_common() {
    echo "Copying common/ to jawn and web..."
    
    # Define destinations
    destinations=(
        "../valhalla/jawn/src/packages/common"
        "../web/packages/common"
    )
    
    # Remove and recreate directories
    for dest in "${destinations[@]}"; do
        rm -rf "$dest"
        mkdir -p "$dest"
    done
    
    # Copy files to all destinations
    for dest in "${destinations[@]}"; do
        rsync -a --exclude="toImplement" common/ "$dest"
        echo "Copied to $dest"
    done
}

# Function to copy all packages
copy_all() {
    echo "Copying all packages..."
    copy_cost
    copy_llm_mapper
    copy_common
    echo "All packages copied successfully!"
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
    common)
        copy_common
        ;;
    all)
        copy_all
        ;;
    *)
        echo "Error: Invalid package name. Must be 'cost', 'llm-mapper', 'common', 'common-client', or 'all'"
        usage
        ;;
esac 