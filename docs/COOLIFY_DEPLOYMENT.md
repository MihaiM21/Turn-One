# 🚀 Turn One Coolify Deployment Guide

This guide explains how to deploy Turn One on Coolify with PostgreSQL.

## 📋 Prerequisites

- Coolify instance set up and running
- PostgreSQL database (provided or external)
- GitHub repository connected to Coolify

## 🗄️ Database Configuration

### PostgreSQL Connection String Format

The application expects a PostgreSQL connection string in the format:
```
Host={host};Port={port};Database={database};Username={username};Password={password}
```

**Example:**
```
Host=91.99.127.72;Port=5433;Database=postgres;Username=postgres;Password=your_password
```

### Dev Database
```
Host=91.99.127.72;Port=5433;Database=postgres;Username=postgres;Password=05k55RYgQiup0oHfa3At0D4bEFhMfAuIk6G7Q3jGHIaGxMmWx0RRlikIMA7NQUMG
```

## 🔧 Coolify Setup

### 1. Create New Application

1. In Coolify, create a new application
2. Connect your GitHub repository: `MihaiM21/Turn-One`
3. Select the `dev` branch (or your deployment branch)
4. Choose Docker Compose as deployment type

### 2. Environment Variables

Add the following environment variables in Coolify:

#### Required Variables

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string | `Host=your-db-host;Port=5432;Database=turnone;Username=postgres;Password=your_password` |
| `ASPNETCORE_ENVIRONMENT` | ASP.NET Core environment | `Production` |
| `APP_BASE_URL` | Base URL of your API | `https://api.yourdomain.com` |

#### Optional Variables

| Variable Name | Description | Default |
|--------------|-------------|---------|
| `API_PORT` | API port | `5271` |
| `CLIENT_PORT` | Client port | `3000` |

### 3. JWT Configuration (Optional)

If you want to override JWT settings, add:

| Variable Name | Description |
|--------------|-------------|
| `JWT__Key` | JWT signing key (min 64 chars) |
| `JWT__Issuer` | JWT issuer |
| `JWT__Audience` | JWT audience |
| `JWT__ExpiryInDays` | Token expiry in days |

### 4. SMTP Configuration (Optional)

For email functionality, add:

| Variable Name | Description |
|--------------|-------------|
| `SmtpSettings__Host` | SMTP server host |
| `SmtpSettings__Port` | SMTP server port |
| `SmtpSettings__EnableSsl` | Enable SSL (true/false) |
| `SmtpSettings__Username` | SMTP username |
| `SmtpSettings__Password` | SMTP password |
| `SmtpSettings__FromEmail` | Sender email address |
| `SmtpSettings__FromName` | Sender name |

## 🐳 Docker Compose Configuration

The `docker-compose.yml` is already configured to use environment variables:

```yaml
services:
  api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=http://+:5271
      - DATABASE_URL=${DATABASE_URL}
  
  client:
    environment:
      - NODE_ENV=production
      - API_URL=http://api:5271
```

## 📝 Deployment Steps

### 1. Initial Setup

1. **Add Environment Variables** in Coolify:
   - Go to your application settings
   - Navigate to "Environment Variables"
   - Add all required variables listed above

2. **Set DATABASE_URL**:
   ```
   DATABASE_URL=Host=your-postgres-host;Port=5432;Database=turnone;Username=postgres;Password=your_secure_password
   ```

3. **Configure Domains**:
   - API: `api.yourdomain.com` → Port 5271
   - Client: `yourdomain.com` → Port 3000

### 2. Database Migration

The application will automatically run migrations on startup. The first deployment will:
- Create all necessary tables
- Set up indexes and constraints
- Seed initial data (admin user and trivia questions)

### 3. Deploy

1. Click "Deploy" in Coolify
2. Monitor the build logs
3. Wait for health checks to pass
4. Access your application

## 🔍 Verification

### Health Checks

- **API**: `https://api.yourdomain.com/health`
- **Client**: `https://yourdomain.com/`

### API Endpoints

Test the API is working:
```bash
curl https://api.yourdomain.com/api/version
```

### Database Connection

Check logs to verify database connection:
```bash
# In Coolify logs, look for:
info: Microsoft.EntityFrameworkCore.Database.Command
# Successful migrations indicate proper connection
```

## 🔄 Environment-Specific Deployments

### Development
```bash
DATABASE_URL=Host=91.99.127.72;Port=5433;Database=postgres;Username=postgres;Password=...
APP_BASE_URL=http://dev.turnonehub.io
ASPNETCORE_ENVIRONMENT=Development
```

### Staging
```bash
DATABASE_URL=Host=your-staging-db;Port=5432;Database=turnone_staging;Username=postgres;Password=...
APP_BASE_URL=https://staging.turnonehub.com
ASPNETCORE_ENVIRONMENT=Staging
```

### Production
```bash
DATABASE_URL=Host=your-prod-db;Port=5432;Database=turnone_production;Username=postgres;Password=...
APP_BASE_URL=https://turnonehub.com
ASPNETCORE_ENVIRONMENT=Production
```

## 🛡️ Security Best Practices

1. **Never commit database credentials** to Git
2. **Use strong passwords** for PostgreSQL
3. **Enable SSL** for database connections when possible
4. **Rotate credentials** regularly
5. **Use Coolify's secrets management** for sensitive variables
6. **Enable HTTPS** for all production domains
7. **Keep JWT keys secure** and sufficiently complex

## 🔧 Troubleshooting

### Database Connection Issues

**Error:** `Failed to connect to the database`

**Solution:**
- Verify `DATABASE_URL` format is correct
- Check database server is accessible from Coolify
- Ensure firewall allows connections from Coolify IP
- Test connection with psql:
  ```bash
  psql "Host=your-host;Port=5432;Database=turnone;Username=postgres;Password=your_pass"
  ```

### Migration Failures

**Error:** `Migration failed`

**Solution:**
- Check database user has sufficient permissions
- Verify database exists
- Review migration logs in Coolify
- Manually run migrations if needed:
  ```bash
  dotnet ef database update --project Infrastructure --startup-project API
  ```

### Environment Variable Not Working

**Error:** Settings not being picked up

**Solution:**
- Ensure variable names use correct format:
  - For appsettings: use `__` (double underscore) for nested values
  - For Program.cs: use exact environment variable name
- Restart the application after adding variables
- Check Coolify logs for environment variable loading

### Port Conflicts

**Error:** `Port already in use`

**Solution:**
- Change `API_PORT` or `CLIENT_PORT` environment variables
- Update port mappings in Coolify
- Ensure no other services are using the same ports

## 📊 Monitoring

### Application Logs

View logs in Coolify dashboard:
- Real-time application logs
- Database query logs
- Error tracking

### Database Monitoring

Monitor your PostgreSQL database:
- Connection count
- Query performance
- Database size
- Active queries

### Performance Metrics

Key metrics to watch:
- API response times
- Database query duration
- Memory usage
- CPU utilization

## 🎉 Success Checklist

- [ ] Database connection string configured
- [ ] Environment variables set in Coolify
- [ ] Domains configured and SSL enabled
- [ ] Application deployed successfully
- [ ] Health checks passing
- [ ] Admin user can login
- [ ] Database migrations applied
- [ ] API responding to requests
- [ ] Client application accessible

Your Turn One Formula 1 platform is now running on Coolify with PostgreSQL! 🏎️

## 📞 Support

For issues:
1. Check Coolify logs
2. Review database connection
3. Verify environment variables
4. Test health endpoints
5. Check GitHub repository issues
