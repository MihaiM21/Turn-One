# Multi-stage build for optimized production image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5271

# Create non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files and restore dependencies (cached layer)
COPY ["turn-one-backend/API/API.csproj", "turn-one-backend/API/"]
COPY ["turn-one-backend/Application/Application.csproj", "turn-one-backend/Application/"]
COPY ["turn-one-backend/Domain/Domain.csproj", "turn-one-backend/Domain/"]
COPY ["turn-one-backend/Infrastructure/Infrastructure.csproj", "turn-one-backend/Infrastructure/"]

RUN dotnet restore "turn-one-backend/API/API.csproj"

# Copy all source files
COPY . .
WORKDIR "/src/turn-one-backend/API"

# Build the application
RUN dotnet build "API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Set ownership and permissions
RUN chown -R appuser:appgroup /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f https://localhost:5271/health || exit 1

ENTRYPOINT ["dotnet", "API.dll"]