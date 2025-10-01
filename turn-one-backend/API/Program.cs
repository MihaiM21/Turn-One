using System.Text;
using Application.Interfaces;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Domain.Entities;
using Domain.Enums;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

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

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "https://localhost:3000", "https://91.107.205.28:3000", "http://91.107.205.28:3000", 
            "https://dev.t1f1.com", "https://dev.turnonehub.com", "https://t1f1.com", "https://turnonehub.com")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .WithExposedHeaders("Authorization", "X-F1-Cookies")
                  .AllowCredentials();
        });
});

// Add DbContext configuration for SQLite
builder.Services.AddDbContext<TurnOneDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IAdminService, AdminService>();

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

var app = builder.Build();

// Apply migrations and seed data before the app starts
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();

    // Apply any pending migrations
    db.Database.Migrate();

    // Seed admin user
    if (!db.Users.Any(u => u.Email == "mihai@t1f1.com"))
    {
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "mihai@t1f1.com",
            Username = "Mihai",
            Password = Environment.GetEnvironmentVariable("ADMIN_PASSWORD")
                       ?? BCrypt.Net.BCrypt.HashPassword("default123"),
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
    }
}


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}

app.UseRouting();
// Use CORS
app.UseCors("AllowSpecificOrigin");

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// app.UseHttpsRedirection();

app.MapControllers();

// Ensure database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();
    db.Database.Migrate();
}

app.Run();
