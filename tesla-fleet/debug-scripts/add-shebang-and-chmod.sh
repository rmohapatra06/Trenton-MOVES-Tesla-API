#!/bin/bash

# Change to the tesla-fleet directory
cd tesla-fleet || exit 1

# Directories to process
DIRS=(
  "vehicleReq/vehicleCommands"
  "vehicleReq/vehicleEndpoints"
  "vehicleReq/userEndpoints"
  "vehicleReq/charging"
)

# Function to process a file
process_file() {
  local file="$1"
  
  # Check if file already has shebang
  if ! head -n1 "$file" | grep -q "^#!"; then
    # Create temp file
    temp_file=$(mktemp)
    echo '#!/usr/bin/env node' > "$temp_file"
    cat "$file" >> "$temp_file"
    mv "$temp_file" "$file"
    echo "Added shebang to $file"
  fi
  
  # Make file executable
  chmod +x "$file"
  echo "Made executable: $file"
}

# Process each directory
for dir in "${DIRS[@]}"; do
  echo "Processing directory: $dir"
  
  # Process all files in directory
  for file in "$dir"/*; do
    if [ -f "$file" ]; then
      process_file "$file"
    fi
  done
done

echo "All files processed!" 