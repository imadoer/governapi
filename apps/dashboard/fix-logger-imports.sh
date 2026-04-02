#!/bin/bash

# Function to calculate correct relative path and fix imports
fix_import_path() {
    local file="$1"
    local dir=$(dirname "$file")

    # Calculate depth from api directory
    local depth=$(echo "$dir" | sed 's|src/app/api||' | grep -o '/' | wc -l)

    # Build correct relative path
    local dots=""
    for ((i=0; i<=depth+2; i++)); do
        dots+="../"
    done
    local correct_path="${dots}utils/logging/logger"

    # Replace the incorrect import
    sed -i "s|import { logger } from \".*utils/logging/logger\"|import { logger } from \"${correct_path}\"|" "$file"

    echo "Fixed: $file -> $correct_path"
}

export -f fix_import_path

# Fix all files that have logger imports
find src/app/api -name "*.ts" -exec grep -l "import.*logger.*utils/logging/logger" {} \; | while read file; do
    fix_import_path "$file"
done
