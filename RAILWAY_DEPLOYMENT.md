# Railway Deployment

AstroAI deploys to Railway as two services in the same project:

- **API**: root directory `server`, uses `server/Dockerfile`
- **Frontend**: root directory `astroai-ui`, uses `astroai-ui/Dockerfile`

Keep Cosmos DB and Supabase external. Railway only hosts the application services.

## API service

Configure the Railway API service with:

- Root directory: `/server`
- Healthcheck path: `/health`
- Public networking enabled

Railway supplies `PORT`. The API binds to `0.0.0.0` on that port. The health endpoint returns HTTP 200 when the process is running.

Set the API configuration as Railway variables. ASP.NET Core nested configuration uses double underscores:

```text
AstroAI__OpenAIEndpoint=https://api.openai.com/v1/chat/completions
AstroAI__OpenAIApiKey=<secret>
AstroAI__ModelId=<model>
AstroAI__ImageModelId=<model>
AstroAI__GoogleMapsApiKey=<key>
AstroAI__GeminiApiKey=<key>
Stripe__SecretKey=<secret>
Stripe__PublishableKey=<publishable-key>
Cosmos__ConnectionString=<connection-string>
Supabase__Url=<url>
Supabase__Audience=authenticated
Supabase__JwksPublicKey__x=<value>
Supabase__JwksPublicKey__y=<value>
Supabase__JwksPublicKey__kid=<value>
GooglePlay__PackageName=app.vedicastro.astro
GooglePlay__ServiceAccountJson=<json>
GooglePlay__AllowUnverifiedFallback=false
Cors__AllowedOrigins=https://vedicastro.app,https://<temporary-frontend-domain>,http://localhost:4200
```

Do not commit these values. The current `server/AstroAI.Api/appsettings.json` contains credentials that should be rotated after migration.

## Frontend service

Configure the Railway frontend service with:

- Root directory: `/astroai-ui`
- Dockerfile: `Dockerfile`
- Public networking enabled

The Angular production build is generated at `dist/astroai-ui` and served by Nginx. Nginx falls back to `index.html` so Angular routes work after a browser refresh.

Before deploying the frontend to Railway, update `src/environments/environment.production.ts` with the API's temporary Railway domain. After custom-domain cutover, replace it with the stable API domain and rebuild.

## Validation order

1. Deploy the API and verify `GET https://<api-domain>/health` returns HTTP 200.
2. Deploy the frontend and verify `/`, static assets, and a refreshed Angular route.
3. Test CORS from the Railway frontend domain.
4. Test Supabase authentication and representative astrology endpoints.
5. Test Stripe and Google Play payment paths.
6. Update custom domains and external OAuth/webhook configuration only after the temporary domains pass.
7. Keep Azure available during the rollback window.
