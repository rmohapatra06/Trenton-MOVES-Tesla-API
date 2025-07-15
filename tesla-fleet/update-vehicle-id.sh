#!/bin/bash

# Function to process a file
process_file() {
    local file="$1"
    # Replace the variable name but keep the environment variable name
    sed -i '' 's/const vin = process\.env\.TESLA_VEHICLE_ID/const vin = process.env.VIN/' "$file"
    sed -i '' 's/${process\.env\.TESLA_VEHICLE_ID}/${process.env.VIN}/g' "$file"
    sed -i '' 's/env\.TESLA_VEHICLE_ID/env.VIN/g' "$file"
    echo "Updated $file"
}

# Process all files in vehicleCommands
for file in vehicleReq/vehicleCommands/*; do
    if [ -f "$file" ]; then
        process_file "$file"
    fi
done

# Process all files in vehicleEndpoints
for file in vehicleReq/vehicleEndpoints/*; do
    if [ -f "$file" ]; then
        process_file "$file"
    fi
done

# Process all files in charging
for file in vehicleReq/charging/*; do
    if [ -f "$file" ]; then
        process_file "$file"
    fi
done

# Process mapsReq.js separately
process_file "vehicleReq/mapsReq.js"

echo "All files have been updated to use VIN instead of TESLA_VEHICLE_ID" 