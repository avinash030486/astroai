# URGENT: Get Your Supabase Anon Key

## The Issue
Your current anon key (`sb_publishable_8EfNafUv2XbC6xS_M7L62A_AuVI1z_w`) is **INCORRECT**.

The correct key should start with `eyJ...` (it's a JWT token).

## Steps to Get the Correct Key

1. **Open your Supabase Dashboard**:
   https://supabase.com/dashboard/project/ywlerjrgbxqceobztaxl

2. **Click on the Settings icon** (⚙️) in the left sidebar

3. **Click on "API"** in the Settings menu

4. **Find the "Project API keys" section**

5. **Copy the "anon" public key** - it should look like:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bGVyanJnYnhxY2VvYnp0YXhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNTc3MTgsImV4cCI6MjA1MzYzMzcxOH0...
   ```

## Update These Files

### File 1: `astroai-ui/src/environments/environment.development.ts`
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:5001',
  supabase: {
    url: 'https://ywlerjrgbxqceobztaxl.supabase.co',
    anonKey: 'PASTE_YOUR_ANON_KEY_HERE' // Should start with eyJ
  }
};
```

### File 2: `astroai-ui/src/environments/environment.production.ts`
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://localhost:5001',
  supabase: {
    url: 'https://ywlerjrgbxqceobztaxl.supabase.co',
    anonKey: 'PASTE_YOUR_ANON_KEY_HERE' // Should start with eyJ
  }
};
```

## Also: Enable Anonymous Sign-in

While you're in the Supabase Dashboard:

1. **Go to Authentication** in the left sidebar
2. **Click on "Providers"**
3. **Scroll down to find "Anonymous"**
4. **Toggle it to ENABLED**
5. **Click Save**

## After Updating

1. **Clear browser storage**:
   - Open DevTools → Application tab
   - Clear Local Storage for localhost:4200
   - Clear Session Storage

2. **Restart your Angular app**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm start
   ```

3. **Open browser console** and look for:
   ```
   ✅ Anonymous session created successfully
   🔑 Access Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Check Network tab** - the Authorization header should now appear!
