#!/bin/bash

# Function to replace console.error with structured logging
replace_console_errors() {
    local file="$1"
    
    # Skip if file doesn't exist or is a backup
    if [[ ! -f "$file" || "$file" == *.backup* ]]; then
        return
    fi
    
    # Create backup
    cp "$file" "$file.logging-backup"
    
    # Add logger import if not present
    if ! grep -q "import.*logger" "$file"; then
        sed -i '1i import { logger } from "../../utils/logging/logger"' "$file"
    fi
    
    # Replace basic console.error patterns
    sed -i 's/console\.error(\([^,)]*\), error)/logger.error(\1, { error: error instanceof Error ? error.message : String(error) })/g' "$file"
    sed -i 's/console\.error(\([^,)]*\))/logger.error(\1)/g' "$file"
    
    echo "Processed: $file"
}

# Export the function so find can use it
export -f replace_console_errors

# Apply to all TypeScript files in src/
find src/app/api -name "*.ts" -exec bash -c 'replace_console_errors "$0"' {} \;

echo "Automated replacement complete. Manual review required for complex cases."
