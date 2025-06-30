#!/usr/bin/env bash
set -euo pipefail

# Script to copy the Tesla Fleet API public key to the required hosted location
# Usage: ./copyPublicKey.sh /path/to/your/public-key.pem

TARGET_PATH="$(dirname "$0")/../tesla-fleet/public/.well-known/appspecific/com.tesla.3p.public-key.pem"

if [[ $# -ge 1 ]]; then
  SRC_KEY="$1"
else
  read -rp "Enter the path to your public key file: " SRC_KEY
fi

if [[ ! -f "$SRC_KEY" ]]; then
  echo "❌ Source public key not found: $SRC_KEY" >&2
  exit 1
fi

echo "📂 Creating target directory if needed..."
mkdir -p "$(dirname "$TARGET_PATH")"

echo "📋 Copying $SRC_KEY to $TARGET_PATH ..."
cp "$SRC_KEY" "$TARGET_PATH"

echo "✅ Public key successfully copied to $TARGET_PATH"
echo "   It will now be hosted at: /.well-known/appspecific/com.tesla.3p.public-key.pem on your domain." 