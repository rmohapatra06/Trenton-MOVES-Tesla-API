tesla-fleet/                      # ← repo root
├─ src/                           # TypeScript source
│  ├─ server.ts                   # Express entry (creates app, starts ngrok if you like)
│  │
│  ├─ routes/
│  │   ├─ health.ts              # GET /health  → { status:"ok" }
│  │   ├─ vehicles.ts            # Vehicle-related routes
│  │   └─ extractToken.ts        # GET /extractToken  (OAuth redirect handler)
│  │
│  └─ utils/
│      └─ tesla.ts               # helper that wraps axios/fetch → Fleet API
│
├─ scripts/                       # Utility scripts
│  ├─ authCodeTokenReq           # Auth code token request script
│  ├─ confirmPublicKey           # Public key confirmation
│  ├─ confirmRegisteredDomain.sh # Domain registration check
│  ├─ copyPublicKey.sh          # Copy public key script
│  ├─ hostPublicKey             # Host public key script
│  ├─ ngrokTunnelRequest.sh     # Ngrok tunnel setup
│  ├─ partnerTokenGenerate      # Generate partner token
│  ├─ refreshToAccess.sh        # Refresh token to access token
│  ├─ refreshTokenGenerate      # Generate refresh token
│  ├─ registerEndpoint.sh       # Register endpoint script
│  ├─ update-callback.js        # Update callback URL
│  ├─ update-code.js           # Update auth code
│  ├─ update-tokens.js         # Update tokens
│  └─ viewTokens.sh            # View stored tokens
│
├─ vehicleReq/                   # Vehicle-related requests
│  ├─ charging/
│  │   ├─ charging_history      # Charging history endpoints
│  │   └─ charging_invoice      # Charging invoice endpoints
│  │
│  ├─ userEndpoints/
│  │   ├─ feature_config       # Feature configuration
│  │   ├─ me                   # User info
│  │   ├─ orders              # Orders info
│  │   └─ region              # Region settings
│  │
│  ├─ vehicleCommands/         # Vehicle control commands
│  │   ├─ actuate_trunk
│  │   ├─ auto_conditioning_start
│  │   ├─ charge_control/
│  │   ├─ climate_control/
│  │   ├─ door_control/
│  │   ├─ media_control/
│  │   ├─ navigation/
│  │   ├─ remote_control/
│  │   └─ settings/
│  │
│  ├─ vehicleEndpoints/        # Vehicle data endpoints
│  │   ├─ fleet_status
│  │   ├─ fleet_telemetry/
│  │   ├─ vehicle_data
│  │   ├─ vehicle
│  │   ├─ subscriptions/
│  │   └─ share_invites/
│  │
│  └─ mapsReq.js              # Maps-related requests
│
├─ public/
│  └─ .well-known/
│      └─ appspecific/
│          └─ com.tesla.3p.public-key.pem   # **exact** filename Tesla will fetch
│
├─ keys/                          # never commit to VCS
│  ├─ private-key.pem            # EC-256 private key  (git-ignored)
│  └─ com.tesla.3p.public-key.pem # copy of the PEM above for convenience
│
├─ views/                         # View templates
│  └─ index.js                   # Main view file
│
├─ fleet.env                      # Environment variables for Fleet API
├─ token.env                      # Token-related environment variables
├─ setup-tesla-integration.sh     # Setup script for Tesla integration
├─ test-integration.js           # Integration test script
├─ test-oauth-url.js            # OAuth URL test script
├─ analyze-oauth-vs-partner.js   # OAuth vs Partner analysis
├─ comprehensive-oauth-test.js   # Comprehensive OAuth testing
├─ debug-oauth.sh               # OAuth debugging script
├─ .gitignore                   # node_modules, dist/, .env, keys/, etc.
├─ package.json                 # deps + scripts  (start/dev/build)
├─ package-lock.json            # auto-generated lockfile
├─ tsconfig.json               # compiler settings (rootDir=src, outDir=dist)
├─ README.md                   # project notes / setup instructions
└─ dist/                      # compiled JS (created by `npm run build`, not committed)
