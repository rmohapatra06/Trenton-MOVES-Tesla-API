tesla-fleet/                      # ← repo root
├─ src/                           # TypeScript source
│  ├─ server.ts                   # Express entry (creates app, starts ngrok if you like)
│  │
│  ├─ routes/
│  │   ├─ health.ts               # GET /health  → { status:"ok" }
│  │   └─ auth.ts                 # GET /extractToken  (OAuth redirect handler)
│  │
│  └─ utils/
│      └─ tesla.ts                # helper that wraps axios/fetch → Fleet API
│
├─ public/
│  └─ .well-known/
│      └─ appspecific/
│          └─ com.tesla.3p.public-key.pem   # **exact** filename Tesla will fetch
│
├─ keys/                          # never commit to VCS
│  ├─ private-key.pem             # EC-256 private key  (git-ignored)
│  └─ com.tesla.3p.public-key.pem # copy of the PEM above for convenience
│
├─ .env                            # CLIENT_ID, CLIENT_SECRET, FLEET_TOKEN… (git-ignored)
├─ .gitignore                      # node_modules, dist/, .env, keys/, etc.
├─ package.json                    # deps + scripts  (start/dev/build)
├─ package-lock.json               # auto-generated lockfile
├─ tsconfig.json                   # compiler settings (rootDir=src, outDir=dist)
├─ README.md                       # project notes / setup instructions
└─ dist/                           # compiled JS (created by `npm run build`, not committed)
