using System.Text;
using Application.Interfaces;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Domain.Entities;
using Domain.Enums;
using API.Services;
using API.Middleware;
using API.Hubs;
using Serilog;
using Serilog.Events;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithThreadId()
    .Enrich.WithProperty("Application", "TurnOne-API")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/turnone-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("Starting Turn One API application...");

var builder = WebApplication.CreateBuilder(args);

// Use Serilog for logging
builder.Host.UseSerilog();

// Add configuration from environment variables
builder.Configuration.AddEnvironmentVariables();

// Override AppSettings:BaseUrl from environment variable if present
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("APP_BASE_URL")))
{
    builder.Configuration["AppSettings:BaseUrl"] = Environment.GetEnvironmentVariable("APP_BASE_URL");
}

// Override database connection string from environment variable if present
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")))
{
    builder.Configuration["ConnectionStrings:DefaultConnection"] = Environment.GetEnvironmentVariable("DATABASE_URL");
}

builder.Configuration["F1:LiveTimingUrl"] =
    Environment.GetEnvironmentVariable("F1_LIVETIMING_URL")
    ?? "https://f1-proxy.YOUR-WORKER.workers.dev";

// Override JWT settings from environment variables if present
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("JWT__Key")))
{
    builder.Configuration["JWT:Key"] = Environment.GetEnvironmentVariable("JWT__Key");
}

// Override SMTP settings from environment variables if present
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("SmtpSettings__Password")))
{
    builder.Configuration["SmtpSettings:Password"] = Environment.GetEnvironmentVariable("SmtpSettings__Password");
}
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("SmtpSettings__Username")))
{
    builder.Configuration["SmtpSettings:Username"] = Environment.GetEnvironmentVariable("SmtpSettings__Username");
}

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

// Add SignalR
builder.Services.AddSignalR();

// Configure Swagger with JWT authentication
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Turn One API",
        Version = "v1",
        Description = "API for Formula One Turn One application"
    });

    // Define the security scheme for JWT Bearer authentication
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Just paste your token below WITHOUT the 'Bearer' prefix. Swagger will add the Bearer prefix for you.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    // Add the security requirement for JWT Bearer
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Get allowed origins from environment variable or use defaults
var allowedOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")?.Split(',')
    ?? new[] 
    {
        "http://localhost:3000", 
        "https://localhost:3000", 
        "http://localhost:3001", 
        "https://localhost:3001",
        "https://dev.turnonehub.com", 
        "https://t1f1.com", 
        "https://turnonehub.com",
        "https://www.t1f1.com",
        "https://www.turnonehub.com"
    };

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .WithExposedHeaders("Authorization", "X-F1-Cookies")
                  .AllowCredentials();
        });
});

// Add SignalR CORS policy  
builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("Authorization", "X-F1-Cookies");
    });
});

// Add DbContext configuration for PostgreSQL
builder.Services.AddDbContext<TurnOneDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<TurnOneDbContext>(
        name: "database",
        failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy,
        tags: new[] { "db", "postgresql" });

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IPageStatusService, PageStatusService>();
builder.Services.AddSingleton<IVersionService, VersionService>();
builder.Services.AddScoped<ILevelSystemService, LevelSystemService>();
builder.Services.AddScoped<IDailyGiftService, DailyGiftService>();

// Register game hub services
builder.Services.AddScoped<ICoinService, CoinService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPredictionService, PredictionService>();
builder.Services.AddScoped<ITriviaService, TriviaService>();
builder.Services.AddScoped<ILeaderboardService, LeaderboardService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmailService, EmailService>(sp =>
{
    var config = builder.Configuration.GetSection("SmtpSettings");
    var logger = sp.GetRequiredService<ILogger<EmailService>>();
    var sendInDev = bool.TryParse(config["SendInDevelopment"], out var sif) ? sif : false;

    return new EmailService(
        config["Host"] ?? throw new InvalidOperationException("SMTP Host not configured"),
        int.Parse(config["Port"] ?? "587"),
        config["FromEmail"] ?? throw new InvalidOperationException("From Email not configured"),
        config["FromName"] ?? "Turn One",
        config["Username"] ?? string.Empty,
        config["Password"] ?? string.Empty,
        sendInDev,
        logger
    );
});

// Add F1 services
builder.Services.AddSingleton<F1LiveTimingService>();
builder.Services.AddSingleton<F1WebSocketService>();

// Add background services
builder.Services.AddHostedService<TokenRefillBackgroundService>();

// Add HttpClient for F1 API proxy
builder.Services.AddHttpClient();

// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration["JWT:Key"] ?? throw new InvalidOperationException("JWT Key not configured"))),
            ValidateIssuer = builder.Environment.IsDevelopment() ? false : true,
            ValidIssuer = builder.Configuration["JWT:Issuer"],
            ValidateAudience = builder.Environment.IsDevelopment() ? false : true,
            ValidAudience = builder.Configuration["JWT:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
        
        // Handle tokens without "Bearer" prefix and add debugging
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // Check if the request is for SignalR hub
                var path = context.HttpContext.Request.Path;
                var accessToken = context.Request.Query["access_token"];

                // If requesting SignalR hub and token is in query string
                if (!string.IsNullOrEmpty(accessToken) && 
                    (path.StartsWithSegments("/hubs") || path.StartsWithSegments("/api/hubs") || path.StartsWithSegments("/api/ws")))
                {
                    context.Token = accessToken;
                    return Task.CompletedTask;
                }

                string authorization = context.Request.Headers["Authorization"].ToString();
                
                // If Authorization header exists but doesn't start with "Bearer "
                if (!string.IsNullOrEmpty(authorization) && !authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    // Set the token directly from the Authorization header
                    context.Token = authorization.Trim();
                    Console.WriteLine($"Received raw token (no Bearer prefix). Token length: {authorization.Length}");
                }
                
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"Authentication failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("Token was successfully validated");
                return Task.CompletedTask;
            }
        };


    });

// Add authorization policies if needed
builder.Services.AddAuthorization();

// === SIMRACING TELEMETRY DI ===
builder.Services.AddScoped<ITelemetrySessionService, TelemetrySessionService>();
builder.Services.AddScoped<ILapAnalyticsService, LapAnalyticsService>();
builder.Services.AddScoped<IOverlayTokenService, OverlayTokenService>();
builder.Services.AddScoped<HeuristicCoachingService>();
builder.Services.AddScoped<ICoachingService>(sp =>
{
    var provider = builder.Configuration["Coaching:Provider"] ?? "Heuristic";
    return provider.Equals("Stub", StringComparison.OrdinalIgnoreCase)
        ? new StubLlmCoachingService(sp.GetRequiredService<HeuristicCoachingService>())
        : sp.GetRequiredService<HeuristicCoachingService>();
});
builder.Services.AddSingleton<ITelemetryTickRepository, InfluxTickRepository>();
builder.Services.AddSingleton<TelemetryIngestionService>();
builder.Services.AddSingleton(System.Threading.Channels.Channel.CreateUnbounded<TickItem>());
builder.Services.AddHostedService<TelemetryPersistenceWorker>();
builder.Services.AddHostedService<TelemetrySweeperWorker>();

var app = builder.Build();

// Start F1 live timing service
var f1Service = app.Services.GetRequiredService<F1LiveTimingService>();
try
{
    await f1Service.StartAsync();
}
catch (Exception ex)
{
    Log.Warning(ex, "F1 live timing service failed to start — app will continue without live data");
}

// Apply migrations and seed data before the app starts
try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();
        
        Log.Information("Applying database migrations...");
        
        // Apply migrations
        db.Database.Migrate();
        
        Log.Information("Database migrations applied successfully");

        // Seed admin user
        if (!db.Users.Any(u => u.Email == "mihai@t1f1.com"))
        {
            Log.Information("Seeding admin user...");
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = "mihai@t1f1.com",
                Username = "Mihai",
                Password = BCrypt.Net.BCrypt.HashPassword("default123"),
                Role = Role.ADMIN,
                Plan = PlanType.ELITE,
                PlanStartDate = DateTime.UtcNow,
                PlanEndDate = DateTime.UtcNow.AddYears(15),
                AutoRenew = true,
                CreatedAt = DateTime.UtcNow,
                LastLogin = DateTime.UtcNow,
                Tokens = 30,
                LastTokenRefillDate = DateTime.UtcNow
            });
            db.SaveChanges();
            Log.Information("Admin user seeded successfully");
        }

        // Seed trivia questions
        Log.Information("Seeding trivia questions...");
        await TriviaSeeder.SeedTriviaQuestions(db);
        Log.Information("Trivia questions seeded successfully");
    }
}
catch (Exception ex)
{
    Log.Error(ex, "Failed to apply migrations or seed data. Connection string: {ConnectionString}", 
        builder.Configuration.GetConnectionString("DefaultConnection")?.Replace(
            builder.Configuration.GetConnectionString("DefaultConnection")?.Split('@').FirstOrDefault() ?? "", "***"));
    throw;
}


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}
else
{
    // In production environments, enforce security measures
    app.UseHsts();
    
    // Add security headers middleware
    app.UseMiddleware<SecurityHeadersMiddleware>();
}

// Use CORS
app.UseCors("AllowSpecificOrigin");

// Serve static files from wwwroot
app.UseStaticFiles();

// Add request logging middleware
app.UseMiddleware<RequestLoggingMiddleware>();

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// app.UseHttpsRedirection();

// Configure WebSocket middleware
app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromMinutes(2)
});
app.UseMiddleware<TelemetryWebSocketMiddleware>();
app.UseMiddleware<WebSocketMiddleware>();

app.MapControllers();

// Map SignalR hubs
app.MapHub<F1LiveDataHub>("/hubs/f1livedata").RequireCors("SignalRCorsPolicy");
app.MapHub<SimTelemetryHub>("/api/hubs/simtelemetry").RequireCors("SignalRCorsPolicy");

Log.Information("Turn One API started successfully");
app.Run();

}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
