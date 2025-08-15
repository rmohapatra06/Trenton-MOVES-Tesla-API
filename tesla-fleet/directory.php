tesla-fleet/                      # ← repo root
├─ src/                           # TypeScript source
│  ├─ server.ts                   # Express entry (creates app, starts ngrok if needed)
│  │
│  ├─ routes/
│  │   ├─ health.ts              # GET /health  → { status:"ok" }
│  │   ├─ vehicles.ts            # Vehicle-related routes
│  │   └─ extractToken.ts        # GET /extractToken  (OAuth redirect handler)
│  │
│  ├─ types/
│  │   └─ tesla-api-toolkit.d.ts # Tesla API type definitions
│  │
│  └─ utils/
│      └─ tesla.ts               # Helper that wraps axios/fetch → Fleet API
│
├─ scripts/                       # Utility scripts
│  ├─ authCodeTokenReq           # Auth code token request script
│  ├─ confirmPublicKey           # Public key confirmation
│  ├─ confirmRegisteredDomain.sh # Domain registration check
│  ├─ copyPublicKey.sh           # Copy public key script
│  ├─ hostPublicKey              # Host public key script
│  ├─ ngrokTunnelRequest.sh      # Ngrok tunnel setup
│  ├─ partnerTokenGenerate       # Generate partner token
│  ├─ refreshToAccess.sh         # Refresh token to access token
│  ├─ refreshTokenGenerate       # Generate refresh token
│  ├─ registerEndpoint.sh        # Register endpoint script
│  ├─ update-callback.js         # Update callback URL
│  ├─ update-code.js            # Update auth code
│  ├─ update-tokens.js          # Update tokens
│  └─ viewTokens.sh             # View stored tokens
│
├─ debug-scripts/                 # Debugging and testing tools
│  ├─ analyze-oauth-vs-partner.js # OAuth vs Partner analysis
│  ├─ comprehensive-oauth-test.js # Comprehensive OAuth testing
│  ├─ debug-oauth.sh             # OAuth debugging script
│  ├─ setup-tesla-integration.sh # Setup script for Tesla integration
│  ├─ test-integration.js       # Integration test script
│  ├─ test-oauth-url.js         # OAuth URL test script
│  └─ tlskeygen.sh              # TLS key generation utility
│
├─ clusterSetup/                 # Kubernetes cluster setup
│  ├─ agentK3s.sh               # K3s agent setup
│  ├─ haproxySetup.sh           # HAProxy configuration
│  ├─ installControlPlaneDB.sh  # Control plane database setup
│  ├─ installK3.sh              # K3s installation
│  ├─ keepAlived.sh             # KeepAlived high availability
│  └─ launchVM.sh               # VM provisioning script
│
├─ vehicleReq/                   # Vehicle-related requests
│  ├─ charging/
│  │   ├─ charging_history      # Charging history endpoints
│  │   └─ charging_invoice      # Charging invoice endpoints
│  │
│  ├─ userEndpoints/
│  │   ├─ feature_config        # Feature configuration
│  │   ├─ me                    # User info
│  │   ├─ orders               # Orders info
│  │   └─ region               # Region settings
│  │
│  ├─ vehicleCommands/          # Vehicle control commands
│  │   ├─ actuate_trunk
│  │   ├─ auto_conditioning_start
│  │   ├─ charge_port_door_close
│  │   ├─ charge_port_door_open
│  │   ├─ door_lock
│  │   ├─ door_unlock
│  │   ├─ flash_lights
│  │   ├─ honk_horn
│  │   ├─ media_toggle_playback
│  │   ├─ navigation_request
│  │   ├─ remote_start_drive
│  │   ├─ set_temps
│  │   └─ window_control
│  │
│  ├─ vehicleEndpoints/         # Vehicle data endpoints
│  │   ├─ fleet_status
│  │   ├─ fleet_telemetry_config_create
│  │   ├─ fleet_telemetry_config_delete
│  │   ├─ fleet_telemetry_config_get
│  │   ├─ list
│  │   ├─ mobile_enabled
│  │   ├─ vehicle
│  │   ├─ vehicle_data
│  │   └─ wake_up
│  │
│  └─ mapsReq.js               # Maps-related requests
│
├─ public/                       # Public assets
│  └─ .well-known/
│      └─ appspecific/
│          └─ com.tesla.3p.public-key.pem   # Tesla verification key
│
├─ keys/                         # API keys (gitignored)
│  ├─ private-key.pem           # EC-256 private key
│  └─ com.tesla.3p.public-key.pem # Public key copy
│
├─ views/                        # View templates
│  └─ index.js                  # Main view file
│
├─ config/                       # Configuration files
├─ dist/                        # Compiled JavaScript (gitignored)
├─ node_modules/                # NPM dependencies (gitignored)
│
├─ .env                         # Main environment variables
├─ fleet.env                    # Fleet API environment variables
├─ token.env                    # Token-related environment variables
├─ .gitignore                   # Git ignore patterns
├─ docker-compose.yml           # Docker services configuration
├─ Dockerfile                   # Container build instructions
├─ nginx.conf                   # Nginx reverse proxy config
├─ package.json                 # NPM dependencies and scripts
├─ package-lock.json            # Dependency lock file
├─ README.md                    # Project documentation
├─ telemetry-config.json        # Tesla telemetry settings
├─ tsconfig.json                # TypeScript compiler settings
└─ values.yaml                  # Kubernetes configuration values
