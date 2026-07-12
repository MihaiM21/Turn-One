# Environment Variables for Turn One

## Backend (API) Environment Variables

### Database Configuration
- **`DATABASE_URL`** (Required for production)
  - PostgreSQL connection string
  - Format: `Host={host};Port={port};Database={database};Username={username};Password={password}`
  - Example: `Host=91.99.127.72;Port=5433;Database=postgres;Username=postgres;Password=your_password`
  - **This overrides the connection string in appsettings.json**

### Application Settings
- **`APP_BASE_URL`** (Optional)
  - Base URL for the API
  - Example: `https://api.turnonehub.com`
  - Used for CORS and email links

### ASP.NET Core Settings
- **`ASPNETCORE_ENVIRONMENT`**
  - Environment name: `Development`, `Staging`, or `Production`
  - Default: `Production` in Docker

- **`ASPNETCORE_URLS`**
  - URLs the application listens on
  - Default: `http://+:5271`

### JWT Configuration (Optional - uses appsettings.json by default)
- **`JWT__Key`** - JWT signing key (minimum 64 characters)
- **`JWT__Issuer`** - JWT token issuer
- **`JWT__Audience`** - JWT token audience
- **`JWT__ExpiryInDays`** - Token expiration in days

### SMTP Configuration (Optional - uses appsettings.json by default)
- **`SmtpSettings__Host`** - SMTP server hostname
- **`SmtpSettings__Port`** - SMTP server port
- **`SmtpSettings__EnableSsl`** - Enable SSL (true/false)
- **`SmtpSettings__Username`** - SMTP username
- **`SmtpSettings__Password`** - SMTP password
- **`SmtpSettings__FromEmail`** - From email address
- **`SmtpSettings__FromName`** - From name

## Coolify Configuration

When deploying to Coolify, set these environment variables:

### Minimum Required
```bash
DATABASE_URL=Host=your-db-host;Port=5432;Database=turnone;Username=postgres;Password=your_password
```

### Recommended for Production
```bash
DATABASE_URL=Host=your-db-host;Port=5432;Database=turnone;Username=postgres;Password=your_password
APP_BASE_URL=https://api.turnonehub.com
ASPNETCORE_ENVIRONMENT=Production
```

## Docker Compose

The `docker-compose.yml` file uses these environment variables:

```yaml
services:
  api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=http://+:5271
      - DATABASE_URL=${DATABASE_URL}
```

You can override them in a `.env` file (see `.env.example`).

## Local Development

For local development, you can:

1. **Use appsettings.json** (default)
   - Connection string is already configured for dev database

2. **Use environment variables**
   - Set `DATABASE_URL` to override the connection string
   - Example PowerShell:
     ```powershell
     $env:DATABASE_URL="Host=91.99.127.72;Port=5433;Database=postgres;Username=postgres;Password=your_password"
     dotnet run
     ```

3. **Use .env file with docker-compose**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   docker-compose up
   ```

## Priority Order

Configuration values are loaded in this order (later overrides earlier):

1. appsettings.json
2. appsettings.{Environment}.json
3. Environment variables
4. Command line arguments

So `DATABASE_URL` environment variable will override `ConnectionStrings:DefaultConnection` from appsettings.json.
