#!/bin/bash

# Function to process a file
process_file() {
    local file="$1"
    # Replace the variable name but keep the environment variable name
    sed -i '' 's/const vin = process\.env\.VIN/const vin = process.env.TESLA_VEHICLE_ID/' "$file"
    sed -i '' 's/${process\.env\.VIN}/${process.env.TESLA_VEHICLE_ID}/g' "$file"
    sed -i '' 's/env\.VIN/env.TESLA_VEHICLE_ID/g' "$file"
    echo "Reverted $file"
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

echo "All files have been reverted to use TESLA_VEHICLE_ID instead of VIN" 