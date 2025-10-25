#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Applies Entity Framework Core migrations to the PostgreSQL database for Turn One application.
.DESCRIPTION
    This script applies the latest Entity Framework Core migrations to the PostgreSQL database.
    It should be run after the database connection is properly configured.
#>

$ErrorActionPreference = "Stop"

# Change to the project directory
Set-Location -Path (Join-Path $PSScriptRoot "..\turn-one-backend")

Write-Host "Applying database migrations..." -ForegroundColor Green

try {
    # Run the EF Core migrations
    dotnet ef database update --project Infrastructure --startup-project API
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully applied database migrations!" -ForegroundColor Green
    } else {
        Write-Host "Failed to apply database migrations. Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "An error occurred while applying migrations: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Database setup complete!" -ForegroundColor Green