# Supabase Anonymous Authentication Setup

## Overview
This implementation adds Supabase anonymous authentication to secure your AstroAI API without requiring a login screen. Users are automatically authenticated in the background, and all API calls include a JWT token.

## Features Implemented

### Frontend (Angular)
✅ **AuthService** (`src/app/services/auth.service.ts`)
  - Automatically creates anonymous sessions on app load
  - Manages JWT tokens and session state
  - Provides token refresh functionality

✅ **Auth Interceptor** (`src/app/interceptors/auth.interceptor.ts`)
  - Automatically adds JWT tokens to API requests
  - Handles token expiration and refresh
  - Skips authentication for public endpoints

✅ **Environment Configuration**
  - Added Supabase URL and anon key settings
  - Configured in both development and production environments

### Backend (.NET 9)
✅ **JWT Authentication**
  - Uses modern JWKS endpoint for automatic key rotation
  - Validates tokens from Supabase
  - Configured in `Program.cs`

✅ **Protected Endpoints**
  - Controllers can use `[Authorize]` for protected routes
  - `[AllowAnonymous]` for public endpoints

## Configuration Steps

### 1. Set Up Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Wait for project to be provisioned

### 2. Enable Anonymous Authentication

1. In Supabase Dashboard, go to **Authentication > Providers**
2. Find **Anonymous Sign-ins**
3. Toggle it **ON**
4. Click **Save**

### 3. Get Your Supabase Credentials

1. Go to **Project Settings > API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 4. Update Angular Environment Files

**File: `astroai-ui/src/environments/environment.development.ts`**
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:5001',
  supabase: {
    url: 'https://YOUR_PROJECT_URL.supabase.co',  // Replace this
    anonKey: 'YOUR_ANON_KEY_HERE'                  // Replace this
  }
};
```

**File: `astroai-ui/src/environments/environment.production.ts`**
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://your-api-domain.com',
  supabase: {
    url: 'https://YOUR_PROJECT_URL.supabase.co',  // Replace this
    anonKey: 'YOUR_ANON_KEY_HERE'                  // Replace this
  }
};
```

### 5. Update .NET API Configuration

**File: `server/AstroAI.Api/appsettings.json`**
```json
{
  "Supabase": {
    "Url": "https://YOUR_PROJECT_URL.supabase.co",  // Replace this
    "Audience": "authenticated"
  }
}
```

**File: `server/AstroAI.Api/appsettings.Development.json`**
```json
{
  "Supabase": {
    "Url": "https://YOUR_PROJECT_URL.supabase.co",  // Replace this
    "Audience": "authenticated"
  }
}
```

## Testing the Implementation

### 1. Start the Backend
```bash
cd server/AstroAI.Api
dotnet run
```

### 2. Start the Frontend
```bash
cd astroai-ui
npm start
```

### 3. Test in Browser
1. Open browser to `http://localhost:4200`
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Look for log messages:
   - `"Anonymous session created"` - ✅ Auth is working
   - `"Token validated successfully"` - ✅ API is accepting tokens

### 4. Verify in Supabase Dashboard
1. Go to **Authentication > Users**
2. You should see anonymous users being created
3. Each user has a UUID but no email

## How It Works

### Authentication Flow
```
1. Angular app loads
   ↓
2. AuthService checks for existing session
   ↓
3. No session found → signInAnonymously()
   ↓
4. Supabase returns JWT token
   ↓
5. Token stored in browser
   ↓
6. User navigates to protected page
   ↓
7. HTTP Interceptor adds token to request
   ↓
8. .NET API validates token via JWKS
   ↓
9. Request proceeds if token valid
```

### Token Lifecycle
- **Initial Creation**: When app loads and no session exists
- **Auto-Refresh**: Supabase client handles refresh automatically
- **Expiration Handling**: Interceptor catches 401 errors and refreshes token
- **Storage**: Tokens stored in browser localStorage by Supabase client

## Endpoint Protection

### Public Endpoints (No Authentication Required)
```csharp
[AllowAnonymous]
[HttpPost("get-daily-predictions")]
public async Task<IActionResult> GetDailyPredictions(CancellationToken ct)
{
    // Anyone can access this
}
```

### Protected Endpoints (Authentication Required)
```csharp
[Authorize]
[HttpPost("generate-basic-chart-prediction")]
public async Task<IActionResult> GenerateBasicChartPrediction([FromBody] BasicChartPredictionRequest req)
{
    // Only authenticated users can access this
    // User ID available via: User.FindFirst(ClaimTypes.NameIdentifier)?.Value
}
```

## Current Endpoint Status

### Public (AllowAnonymous)
- ✅ `/api/predictions/get-daily-predictions`
- ✅ `/api/predictions/get-daily-panchang`

### Protected (Requires Auth)
- 🔒 `/api/horoscope/south-indian`
- 🔒 `/api/horoscope/ask`
- 🔒 `/api/predictions/generate-basic-chart-prediction`
- 🔒 `/api/predictions/generate-detailed-prediction`
- 🔒 `/api/payments/charge`

## Troubleshooting

### Issue: "Anonymous session created" not appearing in console
**Solution**: Check that Supabase URL and anon key are correct in environment files

### Issue: API returns 401 Unauthorized
**Solutions**:
1. Verify Supabase URL in `appsettings.json` matches your project
2. Check that anonymous sign-ins are enabled in Supabase dashboard
3. Ensure `Audience` is set to `"authenticated"` in appsettings

### Issue: CORS errors
**Solution**: Verify CORS configuration in `Program.cs` includes your Angular dev server URL

### Issue: Token not being sent to API
**Solutions**:
1. Check browser console for errors in AuthService
2. Verify HttpInterceptor is registered in app.module.ts
3. Check that API endpoint URL doesn't match skip patterns in interceptor

## Security Notes

- ✅ No user credentials to manage
- ✅ Tokens expire automatically (default: 1 hour)
- ✅ JWKS provides automatic key rotation
- ✅ Each browser session gets unique anonymous user
- ⚠️ Anonymous users can access protected endpoints
- ⚠️ Consider adding rate limiting for anonymous users
- ⚠️ For production, consider additional security layers (API keys, rate limiting, etc.)

## Future Enhancements

If you want to add real user authentication later:
1. Enable Email/Password or OAuth providers in Supabase
2. Add login UI components in Angular
3. Use `supabase.auth.signInWithPassword()` or `signInWithOAuth()`
4. Backend automatically handles both anonymous and authenticated users
5. No changes needed to API authentication logic

## Files Created/Modified

### Created
- `astroai-ui/src/app/services/auth.service.ts`
- `astroai-ui/src/app/interceptors/auth.interceptor.ts`

### Modified
- `astroai-ui/src/environments/environment.development.ts`
- `astroai-ui/src/environments/environment.production.ts`
- `astroai-ui/src/app/app.module.ts`
- `astroai-ui/tsconfig.json`
- `astroai-ui/tsconfig.app.json`
- `server/AstroAI.Api/Program.cs`
- `server/AstroAI.Api/appsettings.json`
- `server/AstroAI.Api/appsettings.Development.json`
- `server/AstroAI.Api/AstroAI.Api.csproj` (added JWT package)

## Support

For issues or questions:
1. Check Supabase Dashboard > Authentication > Logs
2. Check browser console for frontend errors
3. Check .NET API console for backend errors
4. Verify all configuration values are correct

## Supabase Dashboard Quick Links

- Authentication Settings: `https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users`
- API Settings: `https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api`
- Auth Providers: `https://supabase.com/dashboard/project/YOUR_PROJECT/auth/providers`
