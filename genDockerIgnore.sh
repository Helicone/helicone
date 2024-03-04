#!/bin/bash

# Start from the current directory
start_dir="."

# Find all .gitignore files and copy them to .dockerignore in their respective directories
find "$start_dir" -type f -name '.gitignore' | while read -r gitignore_file; do
    dockerignore_file="${gitignore_file%/*}/.dockerignore"
    echo "Copying $gitignore_file to $dockerignore_file"
    cp "$gitignore_file" "$dockerignore_file"
done

echo "All .gitignore files have been copied to .dockerignore files."
