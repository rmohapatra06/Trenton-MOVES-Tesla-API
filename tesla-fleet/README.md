# Tesla Fleet API Integration (Official OAuth)

This project now uses the official Tesla Fleet API OAuth flow for authentication, as described in the [Tesla Fleet API documentation](https://developer.tesla.com/docs/fleet-api/authentication/third-party-tokens).

## Prerequisites

1. **Tesla Developer Account**: You must have a registered and approved Tesla developer account
2. **Node.js**: Version 16 or higher
3. **ngrok**: For exposing your local server to the internet
4. **Register your redirect URI**: In the Tesla developer portal, add your ngrok domain with `/extractToken` as an allowed redirect URI (e.g., `https://your-ngrok-domain.ngrok-free.app/extractToken`)
5. **Your official client ID**: Use the client ID (UUID) from your Tesla developer portal

## Key Files

- **Private Key**: `keys/private-key.pem` (for vehicle command signing, if needed)
- **Public Key**: `public/.well-known/appspecific/com.tesla.3p.public-key.pem` (for vehicle key pairing, if needed)

## Setup Instructions

### 1. Environment Configuration

Create a `fleet.env` file in the root directory with your ngrok domain and client ID:

```bash
CLIENT_ID='your-client-id-from-tesla-portal'
NGROK_DOMAIN='your-ngrok-domain.ngrok-free.app'
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`.

### 4. Expose Server with ngrok

```bash
ngrok http 3000
```

Note the ngrok URL (e.g., `https://abc123.ngrok-free.app`).

### 5. Register Redirect URI in Tesla Developer Portal

- Go to your Tesla developer portal
- Add your ngrok domain with `/extractToken` as an allowed redirect URI
  - Example: `https://abc123.ngrok-free.app/extractToken`

### 6. Authenticate with Tesla (Official OAuth)

1. **Generate the OAuth URL:**
   - Use the following format:
     ```
     https://auth.tesla.com/oauth2/v3/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://your-ngrok-domain.ngrok-free.app/extractToken&response_type=code&scope=openid%20email%20offline_access&state=test
     ```
   - You can generate this URL using `node test-oauth-url.js`.

2. **Visit the OAuth URL in your browser**
   - Log in and consent to the requested permissions
   - Tesla will redirect to your `/extractToken` endpoint with a `code` parameter

3. **Your backend exchanges the code for tokens**
   - The `/extractToken` endpoint will POST to:
     - `https://auth.tesla.com/oauth2/v3/token`
     - With:
       - `grant_type=authorization_code`
       - `client_id=YOUR_CLIENT_ID`
       - `code=...`
       - `redirect_uri=https://your-ngrok-domain.ngrok-free.app/extractToken`
   - The response will include an access token and refresh token

4. **Use the access token to call the Fleet API**
   - Use the returned access token as a Bearer token for API calls

## API Endpoints

### Authentication
- `GET /extractToken` - Handles the OAuth code exchange and returns tokens

## Troubleshooting

- **"unauthorized_client" error:**
  - Make sure you are using your official client ID in the OAuth URL and token exchange
  - Make sure your redirect URI matches exactly what is registered in the Tesla developer portal
  - Use only the scopes: `openid email offline_access`
  - Try the OAuth URL in an incognito browser window

- **Other issues:**
  - Check server logs for error messages
  - Make sure ngrok is running and accessible
  - Ensure your Tesla developer account is approved for third-party API access

## File Structure

```
tesla-fleet/
├── src/
│   ├── routes/
│   │   └── auth.ts          # Authentication endpoint (official OAuth)
│   └── server.ts            # Main server file
├── keys/
│   └── private-key.pem      # EC private key for signing commands (if needed)
├── public/
│   └── .well-known/
│       └── appspecific/
│           └── com.tesla.3p.public-key.pem       # EC public key for pairing (if needed)
├── fleet.env                # Environment variables (DO NOT COMMIT)
├── test-oauth-url.js        # Script to generate the OAuth URL
└── README.md                # This file
```

## Notes
- This project now uses the official Tesla Fleet API OAuth flow.
- Use your official client ID from the Tesla developer portal.
- You do not need a client secret for the third-party flow.
- All user authentication is handled via the official OAuth flow and access tokens. 