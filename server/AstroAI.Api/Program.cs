using AstroAI.Core.Services;
using AstroAI.Core.Configuration;
using AstroAI.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        // Allow empty string -> null for nullable doubles (latitude/longitude)
        opts.JsonSerializerOptions.Converters.Add(new AstroAI.Api.Converters.NullableDoubleEmptyStringConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Bind AstroAI settings from configuration
builder.Services.Configure<AstroAiSettings>(builder.Configuration.GetSection("AstroAI"));

// CORS: allow Angular dev server
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// HttpClient
builder.Services.AddHttpClient();

// DI services
builder.Services.AddScoped<IGptAstrologyService, GptAstrologyService>();
builder.Services.AddScoped<IGptLocationService, GptLocationService>();
builder.Services.AddScoped<IKpHoroscopeService, KpHoroscopeService>();
// Use Swiss Ephemeris for accurate positions; fallback to stub if needed by swapping DI
builder.Services.AddSingleton<IEphemerisService, SwissEphemerisService>();
builder.Services.AddSingleton<IVimshottariDashaService, VimshottariDashaService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.Run();
