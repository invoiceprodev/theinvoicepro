# Auth0 CORS Error - Status and Required Fix

## Reported Error
`https://www.theinvoicepro.co.za` receives a CORS error when the Auth0 SPA SDK calls `https://dev-2deso6nwf6phu0hc.us.auth0.com/oauth/token`.

The API CORS middleware does not control this request; the browser calls Auth0 directly. A live check returned `Access-Control-Allow-Origin: *` on the OPTIONS preflight, but no `Access-Control-Allow-Origin` on an actual POST response. API CORS changes or redeploying the frontend cannot resolve this error.

## Required Auth0 Configuration
In Auth0, open the customer application whose client ID is configured as `VITE_CUSTOMER_AUTH0_CLIENT_ID` (or the customer fallback `VITE_AUTH0_CLIENT_ID`). Add this exact origin under **Allowed Origins (CORS)**:

`https://www.theinvoicepro.co.za`

Also include it in **Allowed Web Origins** for SPA silent authentication. Keep the origin list explicit; do not use `*`. Verify that the same app has the matching production callback URL `https://www.theinvoicepro.co.za/auth/callback` and logout URL `https://www.theinvoicepro.co.za`.

This dashboard change requires access to the Auth0 tenant and has not been applied from this repository.

## Existing Backend Signup/Reset Proxy
The API proxy routes below handle database signup and password reset only. They do **not** handle or fix `/oauth/token`.

### 1. Created Backend Auth Proxy (`api/src/auth-routes.ts`)
New Express router with two public endpoints that proxy Auth0 requests:

```
POST /auth/signup
- Accepts: domain, clientId, connection, name, username, email, password
- Returns: Auth0 signup response or error

POST /auth/forgot-password  
- Accepts: domain, clientId, connection, email
- Returns: Password reset email sent confirmation or error
```

The API-to-Auth0 requests avoid browser CORS for these two operations. Error messages are normalized before returning to the frontend.

### 2. Updated Frontend (`src/lib/auth0-db.ts`)
Modified the authentication library to use the new backend endpoints:

- `signupWithAuth0Database()` → calls `POST /api/auth/signup` instead of Auth0 directly
- `sendAuth0PasswordResetEmail()` → calls `POST /api/auth/forgot-password` instead of Auth0 directly

**No Breaking Changes:**
- Function signatures remain unchanged
- Error handling preserved
- All user-facing messages maintained

### 3. Integrated with API Server (`api/src/server.ts`)
- Imported the new `authRouter` 
- Registered it under `/auth` path
- Routes available at `http://api-base-url/auth/signup` and `http://api-base-url/auth/forgot-password`

## Security Notes
The SPA's `/oauth/token` request is expected for a public Auth0 application. Do not add a client secret to the frontend or proxy the token exchange through the API as a CORS workaround. The signup/reset proxy receives the Auth0 domain, client ID, and connection from the browser; these are public application configuration values, not secrets.

## Testing Checklist

### Backend Tests
- [ ] Verify TypeScript compilation: `npm run build` in `api/` directory
- [ ] Test signup endpoint with valid credentials
- [ ] Test signup with duplicate email
- [ ] Test password reset with valid email
- [ ] Test password reset with non-existent email
- [ ] Verify error responses have proper user-facing messages

### Frontend Tests
- [ ] Test user registration flow (customer app)
- [ ] Test admin registration flow (admin app)
- [ ] Test password reset flow
- [ ] Verify error messages display correctly
- [ ] Test with API gateway offline (should show "API gateway is not configured")
- [ ] Confirm signup/reset requests go to the API; the SPA still exchanges its authorization code directly with Auth0

### Integration Tests
- [ ] Perform end-to-end signup flow
- [ ] Perform end-to-end password reset flow
- [ ] Monitor browser DevTools - should see:
  - Requests to the API for `/auth/signup` and `/auth/forgot-password`
  - A request to Auth0 `/oauth/token` for the SPA authorization-code exchange

## Files Modified
1. **api/src/auth-routes.ts** - NEW: Backend auth proxy endpoints
2. **api/src/server.ts** - MODIFIED: Added auth router import and registration
3. **src/lib/auth0-db.ts** - MODIFIED: Updated to use backend API instead of direct Auth0 calls

## Rollback Instructions
If needed, revert to direct Auth0 calls:
1. Delete `api/src/auth-routes.ts`
2. Remove auth router import from `api/src/server.ts`
3. Restore original `src/lib/auth0-db.ts` implementation

## Additional Notes
- The `apiRequest()` function in `src/lib/api-client.ts` is used for backend communication
- The API must be configured with `API_BASE_URL` or `VITE_API_URL` environment variable
- For production, ensure both frontend and backend can communicate securely
