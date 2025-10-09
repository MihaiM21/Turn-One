# PowerShell script to update the version of Turn One using only the database API
# Usage: .\update-version-db.ps1 [major|minor|patch] [pre-release] [build-metadata] [release-notes]
# Example: .\update-version-db.ps1 patch beta.1 build.123 "Fixed bug in telemetry"

param(
    [Parameter(Position=0)]
    [ValidateSet("major", "minor", "patch")]
    [string]$VersionType,
    
    [Parameter(Position=1)]
    [string]$PreRelease = "",
    
    [Parameter(Position=2)]
    [string]$BuildMetadata = "",
    
    [Parameter(Position=3)]
    [string]$ReleaseNotes = "Version update"
)

# Environment variables
$ApiUrl = $env:API_URL
if (-not $ApiUrl) {
    $ApiUrl = "http://localhost:5271/api"
}

# Functions
function Show-Help {
    Write-Host "Usage: .\update-version-db.ps1 [major|minor|patch] [pre-release] [build-metadata] [release-notes]"
    Write-Host "Example: .\update-version-db.ps1 patch beta.1 build.123 'Fixed bug in telemetry'"
    Write-Host ""
    Write-Host "Updates the version according to semantic versioning:"
    Write-Host "  - major: Increments major version, resets minor and patch to 0"
    Write-Host "  - minor: Increments minor version, resets patch to 0"
    Write-Host "  - patch: Increments patch version"
    Write-Host "  - pre-release: Optional pre-release label (alpha, beta, etc.)"
    Write-Host "  - build-metadata: Optional build metadata"
    Write-Host "  - release-notes: Optional release notes"
    Write-Host ""
    Write-Host "Environment variables:"
    Write-Host "  - API_URL: URL of the Turn One API (default: http://localhost:5271/api)"
    Write-Host "  - API_TOKEN: Bearer token for API authentication (optional)"
    exit 1
}

function Get-CurrentVersion {
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }

        if ($env:API_TOKEN) {
            $headers["Authorization"] = "Bearer $($env:API_TOKEN)"
        }
        
        $response = Invoke-RestMethod -Method Get -Uri "$ApiUrl/version/current" -Headers $headers
        return $response
    }
    catch {
        Write-Error "Failed to get current version from API: $_"
        exit 1
    }
}

function Update-Version {
    param(
        [string]$type,
        [string]$preRelease,
        [string]$buildMetadata,
        [string]$releaseNotes
    )
    
    $currentVersion = Get-CurrentVersion
    $versionInfo = @{
        Major = $currentVersion.major
        Minor = $currentVersion.minor
        Patch = $currentVersion.patch
    }
    
    switch ($type) {
        "major" {
            $versionInfo.Major++
            $versionInfo.Minor = 0
            $versionInfo.Patch = 0
        }
        "minor" {
            $versionInfo.Minor++
            $versionInfo.Patch = 0
        }
        "patch" {
            $versionInfo.Patch++
        }
        default {
            Show-Help
        }
    }
    
    try {
        Write-Host "Updating version in API..."
        $body = @{
            major = $versionInfo.Major
            minor = $versionInfo.Minor
            patch = $versionInfo.Patch
            preRelease = $preRelease
            buildMetadata = $buildMetadata
            releaseNotes = $releaseNotes
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
        }

        if ($env:API_TOKEN) {
            $headers["Authorization"] = "Bearer $($env:API_TOKEN)"
        }
        
        $response = Invoke-RestMethod -Method Post -Uri "$ApiUrl/version/update" -Headers $headers -Body $body
        
        # Format the version string for display
        $newVersion = "$($response.major).$($response.minor).$($response.patch)"
        if (-not [string]::IsNullOrEmpty($response.preRelease)) {
            $newVersion += "-$($response.preRelease)"
        }
        if (-not [string]::IsNullOrEmpty($response.buildMetadata)) {
            $newVersion += "+$($response.buildMetadata)"
        }
        
        Write-Host "Version successfully updated to $newVersion"
        
        # Optional: suggest git tagging
        Write-Host ""
        Write-Host "Suggestion: Create a git tag for this version:"
        Write-Host "git commit -m 'Bump version to $newVersion'"
        Write-Host "git tag v$newVersion"
        Write-Host "git push && git push --tags"
    }
    catch {
        Write-Error "Failed to update version: $_"
        exit 1
    }
}

# Main
if (-not $VersionType) {
    Show-Help
}
else {
    Update-Version -type $VersionType -preRelease $PreRelease -buildMetadata $BuildMetadata -releaseNotes $ReleaseNotes
}