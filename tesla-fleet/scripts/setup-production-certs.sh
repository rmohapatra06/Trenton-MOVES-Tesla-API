#!/usr/bin/env bash
set -euo pipefail

# Production Certificate Setup Script for Tesla Fleet API
# This script sets up proper SSL/TLS certificates for production use

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROD_CONFIG_DIR="$PROJECT_ROOT/config/production"
CA_BUNDLE="$PROD_CONFIG_DIR/ca-bundle.pem"

echo "🔒 Setting up production certificates..."

# Create production config directory
mkdir -p "$PROD_CONFIG_DIR"

# Function to check if OpenSSL is available
check_openssl() {
  if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL is required but not installed. Please install OpenSSL first."
    exit 1
  fi
}

# Function to check if certificate exists and is valid
check_cert_validity() {
  local cert_file="$1"
  if [[ -f "$cert_file" ]]; then
    local end_date
    end_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
    local end_epoch
    end_epoch=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$end_date" "+%s")
    local now_epoch
    now_epoch=$(date "+%s")
    
    # If certificate expires in less than 30 days, return false
    if (( end_epoch - now_epoch < 2592000 )); then
      return 1
    fi
    return 0
  fi
  return 1
}

# 1. Set up CA bundle
setup_ca_bundle() {
  echo "📦 Setting up CA bundle..."
  
  # Copy system CA certificates
  if [[ -f "/etc/ssl/cert.pem" ]]; then
    cp "/etc/ssl/cert.pem" "$CA_BUNDLE"
  elif [[ -f "/etc/ssl/certs/ca-certificates.crt" ]]; then
    cp "/etc/ssl/certs/ca-certificates.crt" "$CA_BUNDLE"
  else
    echo "❌ Could not find system CA certificates"
    exit 1
  fi
  
  echo "✅ CA bundle created at $CA_BUNDLE"
}

# 2. Generate production TLS certificate (if using self-signed)
setup_tls_cert() {
  local tls_cert="$PROD_CONFIG_DIR/tls-cert.pem"
  local tls_key="$PROD_CONFIG_DIR/tls-key.pem"
  
  if check_cert_validity "$tls_cert"; then
    echo "✅ TLS certificate is valid and not expiring soon"
    return
  fi
  
  echo "🔑 Generating new TLS certificate..."
  
  # Generate a strong private key and CSR
  openssl req -new -newkey ec \
    -pkeyopt ec_paramgen_curve:secp384r1 \
    -pkeyopt ec_param_enc:named_curve \
    -days 365 \
    -nodes \
    -subj "/C=US/ST=CA/O=Tesla Fleet API/CN=${DOMAIN:-localhost}" \
    -keyout "$tls_key" \
    -out "$PROD_CONFIG_DIR/tls.csr"
    
  # Self-sign the certificate (in production, you'd submit the CSR to a CA)
  openssl x509 -req \
    -days 365 \
    -in "$PROD_CONFIG_DIR/tls.csr" \
    -signkey "$tls_key" \
    -out "$tls_cert" \
    -sha384 \
    -extensions v3_req \
    -extfile <(echo "
      [ v3_req ]
      basicConstraints = CA:FALSE
      keyUsage = digitalSignature, keyEncipherment
      extendedKeyUsage = serverAuth
      subjectAltName = @alt_names
      [ alt_names ]
      DNS.1 = ${DOMAIN:-localhost}
      DNS.2 = tesla_http_proxy
    ")
    
  rm "$PROD_CONFIG_DIR/tls.csr"
  chmod 600 "$tls_key"
  echo "✅ TLS certificate generated"
}

# 3. Set up Tesla Fleet API key pair
setup_fleet_keys() {
  local fleet_key="$PROD_CONFIG_DIR/fleet-key.pem"
  local public_key_dir="$PROJECT_ROOT/public/.well-known/appspecific"
  local public_key="$public_key_dir/com.tesla.3p.public-key.pem"
  
  if [[ -f "$fleet_key" && -f "$public_key" ]]; then
    echo "✅ Fleet API keys already exist"
    return
  fi
  
  echo "🔑 Generating Tesla Fleet API key pair..."
  
  # Create public key directory
  mkdir -p "$public_key_dir"
  
  # Generate EC key pair for Tesla Fleet API
  openssl ecparam -genkey -name prime256v1 -noout -out "$fleet_key"
  chmod 600 "$fleet_key"
  
  # Extract public key
  openssl ec -in "$fleet_key" -pubout -out "$public_key"
  
  echo "✅ Fleet API keys generated"
}

# Main execution
main() {
  check_openssl
  
  # Create production config directory if it doesn't exist
  mkdir -p "$PROD_CONFIG_DIR"
  
  # Set up certificates
  setup_ca_bundle
  setup_tls_cert
  setup_fleet_keys
  
  echo "✅ All production certificates have been set up successfully"
  echo "⚠️  Remember:"
  echo "   1. Keep private keys secure and never commit them to version control"
  echo "   2. In production, use proper SSL certificates from a trusted CA"
  echo "   3. Regularly monitor certificate expiration dates"
  echo "   4. Set up automated certificate renewal"
}

main "$@" 