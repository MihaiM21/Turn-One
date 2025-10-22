# PowerShell script to update the version of Turn One
# Usage: .\update-version.ps1 [major|minor|patch] [pre-release] [build-metadata] [release-notes]
# Example: .\update-version.ps1 patch beta.1 build.123 "Fixed bug in telemetry"

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

# Functions
function Show-Help {
    Write-Host "Usage: .\update-version.ps1 [major|minor|patch] [pre-release] [build-metadata] [release-notes]"
    Write-Host "Example: .\update-version.ps1 patch beta.1 build.123 'Fixed bug in telemetry'"
    Write-Host ""
    Write-Host "Updates the version according to semantic versioning:"
    Write-Host "  - major: Increments major version, resets minor and patch to 0"
    Write-Host "  - minor: Increments minor version, resets patch to 0"
    Write-Host "  - patch: Increments patch version"
    Write-Host "  - pre-release: Optional pre-release label (alpha, beta, etc.)"
    Write-Host "  - build-metadata: Optional build metadata"
    Write-Host "  - release-notes: Optional release notes"
    exit 1
}

function Get-CurrentVersion {
    Get-Content -Path (Join-Path $PSScriptRoot "..\turn-one-backend\VERSION")
}

function Parse-Version {
    param(
        [string]$version
    )
    
    $versionParts = $version.Split('.')
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    
    $patchPlusRest = $versionParts[2]
    
    # Extract patch, pre-release and build metadata
    $patch = $patchPlusRest
    $preRelease = ""
    $buildMetadata = ""
    
    if ($patchPlusRest -match "^(\d+)(-([^+]+))?(\+(.+))?$") {
        $patch = $Matches[1]
        if ($Matches.ContainsKey(3)) { $preRelease = $Matches[3] }
        if ($Matches.ContainsKey(5)) { $buildMetadata = $Matches[5] }
    }
    
    return @{
        Major = $major
        Minor = $minor
        Patch = $patch
        PreRelease = $preRelease
        BuildMetadata = $buildMetadata
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
    $versionInfo = Parse-Version -version $currentVersion
    
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
    
    # Apply pre-release and build-metadata if provided
    $newVersion = "$($versionInfo.Major).$($versionInfo.Minor).$($versionInfo.Patch)"
    if ($preRelease) {
        $newVersion += "-$preRelease"
    }
    if ($buildMetadata) {
        $newVersion += "+$buildMetadata"
    }
    
    $versionFilePath = Join-Path $PSScriptRoot "..\turn-one-backend\VERSION"
    Set-Content -Path $versionFilePath -Value $newVersion
    
    Write-Host "Version updated from $currentVersion to $newVersion"
    
    # If the backend API is available, update it via API
    if ($env:API_URL) {
        Write-Host "Updating version in API..."
        $body = @{
            major = $versionInfo.Major
            minor = $versionInfo.Minor
            patch = $versionInfo.Patch
            preRelease = $preRelease
            buildMetadata = $buildMetadata
            releaseNotes = $releaseNotes
        } | ConvertTo-Json
        
        Invoke-RestMethod -Method Post -Uri "$($env:API_URL)/api/version/update" `
                        -Headers @{
                            "Content-Type" = "application/json"
                            "Authorization" = "Bearer $($env:API_TOKEN)"
                        } `
                        -Body $body
    }
    
    Write-Host "Don't forget to commit and tag this version:"
    Write-Host "git add turn-one-backend/VERSION"
    Write-Host "git commit -m 'Bump version to $newVersion'"
    Write-Host "git tag v$newVersion"
    Write-Host "git push && git push --tags"
}

# Main
if (-not $VersionType) {
    Show-Help
}
else {
    Update-Version -type $VersionType -preRelease $PreRelease -buildMetadata $BuildMetadata -releaseNotes $ReleaseNotes
}