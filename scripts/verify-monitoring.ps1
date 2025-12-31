#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick monitoring verification script for Turn One application
.DESCRIPTION
    Tests all monitoring endpoints and verifies logging is working
#>

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "🔍 Turn One Monitoring Verification" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = $env:APP_BASE_URL ?? "http://localhost:5271"
$clientUrl = $env:CLIENT_URL ?? "http://localhost:3000"

Write-Host "Testing Backend: $baseUrl" -ForegroundColor Yellow
Write-Host "Testing Frontend: $clientUrl" -ForegroundColor Yellow
Write-Host ""

# Test Backend Health Endpoints
Write-Host "📊 Backend Health Checks" -ForegroundColor Green
Write-Host "------------------------" -ForegroundColor Green

try {
    Write-Host "  ✓ Testing /health... " -NoNewline
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
    Write-Host "OK" -ForegroundColor Green
    Write-Host "    Status: $($health.status)" -ForegroundColor Gray
    Write-Host "    Uptime: $($health.uptime)" -ForegroundColor Gray
    Write-Host "    Version: $($health.version)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "  ✓ Testing /health/ready... " -NoNewline
    $ready = Invoke-RestMethod -Uri "$baseUrl/health/ready" -Method Get -ErrorAction Stop
    Write-Host "OK" -ForegroundColor Green
    Write-Host "    Status: $($ready.status)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "  ✓ Testing /health/live... " -NoNewline
    $live = Invoke-RestMethod -Uri "$baseUrl/health/live" -Method Get -ErrorAction Stop
    Write-Host "OK" -ForegroundColor Green
    Write-Host "    Status: $($live.status)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "  ✓ Testing /health/metrics... " -NoNewline
    $metrics = Invoke-RestMethod -Uri "$baseUrl/health/metrics" -Method Get -ErrorAction Stop
    Write-Host "OK" -ForegroundColor Green
    Write-Host "    Memory: $($metrics.process.memoryMB) MB" -ForegroundColor Gray
    Write-Host "    Threads: $($metrics.process.threadCount)" -ForegroundColor Gray
    Write-Host "    GC Memory: $($metrics.runtime.gcTotalMemoryMB) MB" -ForegroundColor Gray
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check Log Files
Write-Host "📝 Log File Verification" -ForegroundColor Green
Write-Host "------------------------" -ForegroundColor Green

$logDir = Join-Path $PSScriptRoot "..\turn-one-backend\API\logs"
if (Test-Path $logDir) {
    $logFiles = Get-ChildItem -Path $logDir -Filter "turnone-*.log" | Sort-Object LastWriteTime -Descending
    
    if ($logFiles.Count -gt 0) {
        $latestLog = $logFiles[0]
        Write-Host "  ✓ Latest log file: $($latestLog.Name)" -ForegroundColor Green
        Write-Host "    Size: $([math]::Round($latestLog.Length / 1KB, 2)) KB" -ForegroundColor Gray
        Write-Host "    Last Modified: $($latestLog.LastWriteTime)" -ForegroundColor Gray
        
        # Show last 5 log entries
        Write-Host ""
        Write-Host "  Last 5 log entries:" -ForegroundColor Gray
        Get-Content $latestLog.FullName -Tail 5 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  ⚠ No log files found" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Log directory not found: $logDir" -ForegroundColor Yellow
    Write-Host "    Logs will be created when the application starts" -ForegroundColor Gray
}

Write-Host ""

# Check Docker Containers (if running)
Write-Host "🐳 Docker Container Status" -ForegroundColor Green
Write-Host "------------------------" -ForegroundColor Green

try {
    $containers = docker ps --filter "name=turn-one" --format "{{.Names}}: {{.Status}}" 2>$null
    if ($containers) {
        $containers | ForEach-Object {
            Write-Host "  ✓ $_" -ForegroundColor Green
        }
    } else {
        Write-Host "  ℹ No Turn One containers running" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ℹ Docker not available or not running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "✅ Monitoring verification complete!" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Set up external monitoring (Sentry, UptimeRobot)" -ForegroundColor Gray
Write-Host "  2. Configure alerting channels" -ForegroundColor Gray
Write-Host "  3. Create monitoring dashboards" -ForegroundColor Gray
Write-Host "  4. Review logs regularly: tail -f $logDir\turnone-*.log" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 See MONITORING_GUIDE.md for detailed setup instructions" -ForegroundColor Gray
Write-Host ""
