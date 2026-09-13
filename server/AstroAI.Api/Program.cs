using AstroAI.Core.Configuration;
using AstroAI.Core.Services;
using AstroAI.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Azure.Cosmos;
using Microsoft.IdentityModel.Tokens;
using Stripe;
using System.Net;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

var railwayPort = builder.Configuration["PORT"];
if (int.TryParse(railwayPort, out var parsedRailwayPort) && parsedRailwayPort > 0)
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{parsedRailwayPort}");
}

// Add Response Caching and Memory Cache for performance
builder.Services.AddResponseCaching();
builder.Services.AddMemoryCache();

// --- SUPABASE AUTHENTICATION (ES256 with EC Public Key) ---
var supabaseUrl = builder.Configuration["Supabase:Url"];
var supabaseAudience = builder.Configuration["Supabase:Audience"] ?? "authenticated";
var publicKeyX = builder.Configuration["Supabase:JwksPublicKey:x"];
var publicKeyY = builder.Configuration["Supabase:JwksPublicKey:y"];
var keyId = builder.Configuration["Supabase:JwksPublicKey:kid"];

if (!string.IsNullOrWhiteSpace(supabaseUrl) && !string.IsNullOrWhiteSpace(publicKeyX) && !string.IsNullOrWhiteSpace(publicKeyY))
{
    Console.WriteLine($"🔐 Configuring Supabase JWT authentication for: {supabaseUrl}");
    Console.WriteLine($"🔑 Using EC Public Key (kid: {keyId})");
    
    try
    {
        // Create EC public key from X and Y coordinates (base64url encoded)
        // Convert base64url to base64
        var xBase64 = publicKeyX.Replace('-', '+').Replace('_', '/');
        var yBase64 = publicKeyY.Replace('-', '+').Replace('_', '/');
        
        // Pad if necessary
        while (xBase64.Length % 4 != 0) xBase64 += "=";
        while (yBase64.Length % 4 != 0) yBase64 += "=";
        
        var xBytes = Convert.FromBase64String(xBase64);
        var yBytes = Convert.FromBase64String(yBase64);
        
        var ecdsa = ECDsa.Create(new ECParameters
        {
            Curve = ECCurve.NamedCurves.nistP256,
            Q = new ECPoint
            {
                X = xBytes,
                Y = yBytes
            }
        });
        
        var securityKey = new ECDsaSecurityKey(ecdsa) { KeyId = keyId };
        
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = $"{supabaseUrl}/auth/v1",
                    ValidateAudience = true,
                    ValidAudience = supabaseAudience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = securityKey,
                    ValidAlgorithms = new[] { "ES256" },
                    ClockSkew = TimeSpan.FromMinutes(5)
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                        if (!string.IsNullOrEmpty(token))
                        {
                            Console.WriteLine($"📨 Token received (first 30 chars): {token.Substring(0, Math.Min(30, token.Length))}...");
                        }
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = context =>
                    {
                        var userId = context.Principal?.FindFirst("sub")?.Value;
                        var role = context.Principal?.FindFirst("role")?.Value;
                        Console.WriteLine($"✅ Token validated successfully");
                        Console.WriteLine($"   User ID: {userId}");
                        Console.WriteLine($"   Role: {role}");
                        return Task.CompletedTask;
                    },
                    OnAuthenticationFailed = context =>
                    {
                        Console.WriteLine($"❌ Authentication failed: {context.Exception.GetType().Name}");
                        Console.WriteLine($"   Message: {context.Exception.Message}");
                        if (context.Exception.InnerException != null)
                        {
                            Console.WriteLine($"   Inner: {context.Exception.InnerException.Message}");
                        }
                        return Task.CompletedTask;
                    },
                    OnChallenge = context =>
                    {
                        Console.WriteLine($"⚠️ Challenge: {context.Error}, {context.ErrorDescription}");
                        return Task.CompletedTask;
                    }
                };
            });

        builder.Services.AddAuthorization();
        Console.WriteLine("✅ Supabase authentication configured with EC Public Key (ES256)");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Failed to configure authentication: {ex.Message}");
    }
}
else
{
    Console.WriteLine("⚠️ Supabase configuration incomplete, authentication disabled");
}

// --- OTHER SERVICES ---
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new AstroAI.Api.Converters.NullableDoubleEmptyStringConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // Swashbuckle doesn't natively support DateOnly/TimeOnly — map them explicitly
    c.MapType<DateOnly>(() => new Microsoft.OpenApi.Models.OpenApiSchema { Type = "string", Format = "date",    Example = new Microsoft.OpenApi.Any.OpenApiString("1990-03-15") });
    c.MapType<TimeOnly>(() => new Microsoft.OpenApi.Models.OpenApiSchema { Type = "string", Format = "time",    Example = new Microsoft.OpenApi.Any.OpenApiString("14:30:00") });
    c.MapType<DateOnly?>(() => new Microsoft.OpenApi.Models.OpenApiSchema { Type = "string", Format = "date",   Nullable = true });
    c.MapType<TimeOnly?>(() => new Microsoft.OpenApi.Models.OpenApiSchema { Type = "string", Format = "time",   Nullable = true });
});
builder.Services.Configure<AstroAiSettings>(builder.Configuration.GetSection("AstroAI"));

// Stripe & Cosmos Configuration
var stripeSecret = builder.Configuration.GetValue<string>("Stripe:SecretKey");
if (!string.IsNullOrWhiteSpace(stripeSecret)) StripeConfiguration.ApiKey = stripeSecret;

// Improve Stripe resiliency for transient network failures.
StripeConfiguration.MaxNetworkRetries = Math.Clamp(
    builder.Configuration.GetValue<int?>("Stripe:MaxNetworkRetries") ?? 2,
    0,
    5);

var cosmosConn = builder.Configuration.GetValue<string>("Cosmos:ConnectionString");
if (!string.IsNullOrWhiteSpace(cosmosConn))
{
    var cosmosRequestTimeoutSeconds = Math.Clamp(
        builder.Configuration.GetValue<int?>("Cosmos:RequestTimeoutSeconds") ?? 15,
        5,
        120);

    var cosmosMaxRateLimitRetries = Math.Clamp(
        builder.Configuration.GetValue<int?>("Cosmos:MaxRetryAttemptsOnRateLimitedRequests") ?? 9,
        0,
        50);

    var cosmosMaxRateLimitRetryWaitSeconds = Math.Clamp(
        builder.Configuration.GetValue<int?>("Cosmos:MaxRetryWaitTimeOnRateLimitedRequests") ?? 30,
        1,
        300);

    builder.Services.AddSingleton(new CosmosClient(
        cosmosConn,
        new CosmosClientOptions
        {
            RequestTimeout = TimeSpan.FromSeconds(cosmosRequestTimeoutSeconds),
            OpenTcpConnectionTimeout = TimeSpan.FromSeconds(10),
            MaxRetryAttemptsOnRateLimitedRequests = cosmosMaxRateLimitRetries,
            MaxRetryWaitTimeOnRateLimitedRequests = TimeSpan.FromSeconds(cosmosMaxRateLimitRetryWaitSeconds)
        }));
}

var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "https://vedicastro.app,http://localhost:4200")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var outboundHttpTimeoutSeconds = Math.Clamp(
    builder.Configuration.GetValue<int?>("HttpClient:TimeoutSeconds") ?? 100,
    5,
    300);

builder.Services
    .AddHttpClient("AstroAI.Default")
    .ConfigureHttpClient(client =>
    {
        client.Timeout = TimeSpan.FromSeconds(outboundHttpTimeoutSeconds);
    })
    .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
    {
        ConnectTimeout = TimeSpan.FromSeconds(10),
        PooledConnectionLifetime = TimeSpan.FromMinutes(5),
        PooledConnectionIdleTimeout = TimeSpan.FromMinutes(2),
        AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
    });
builder.Services
    .AddHttpClient<IPremiumBirthChartStore, SupabasePremiumBirthChartStore>((serviceProvider, client) =>
    {
        var configuration = serviceProvider.GetRequiredService<IConfiguration>();
        var supabaseUrl = configuration["Supabase:Url"];
        if (!string.IsNullOrWhiteSpace(supabaseUrl))
        {
            client.BaseAddress = new Uri($"{supabaseUrl.TrimEnd('/')}/rest/v1/");
        }

        var supabaseTimeoutSeconds = Math.Clamp(
            configuration.GetValue<int?>("Supabase:RestTimeoutSeconds") ?? 30,
            5,
            120);
        client.Timeout = TimeSpan.FromSeconds(supabaseTimeoutSeconds);
    });
builder.Services.AddScoped<IGptAstrologyService, GptAstrologyService>();
builder.Services.AddScoped<IGptLocationService, GptLocationService>();
builder.Services.AddScoped<IKpHoroscopeService, KpHoroscopeService>();
builder.Services.AddSingleton<IEphemerisService, SwissEphemerisService>();
builder.Services.AddSingleton<IVimshottariDashaService, VimshottariDashaService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Don't force HTTPS redirect in development when using HTTP
// app.UseHttpsRedirection();

app.UseCors();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (OperationCanceledException) when (!context.RequestAborted.IsCancellationRequested)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = StatusCodes.Status504GatewayTimeout;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                error = "Request timed out. Please retry."
            });
        }
    }
    catch (TimeoutException)
    {
        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = StatusCodes.Status504GatewayTimeout;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                error = "Request timed out. Please retry."
            });
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Unhandled API exception for {Method} {Path}", context.Request.Method, context.Request.Path);
        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                error = "The API could not complete this request. Check the API deployment logs."
            });
        }
    }
});

// Add response caching middleware
app.UseResponseCaching();

// Order matters: Authentication then Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }))
    .WithName("Health");
app.MapControllers();
app.Run();
