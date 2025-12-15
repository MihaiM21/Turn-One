# PowerShell script to automatically update version based on conventional commits
# Usage: .\update-version-auto.ps1 [-FromCommit <commit>] [-ToCommit <commit>] [-Force] [-DryRun]
# Example: .\update-version-auto.ps1 -FromCommit HEAD~5 -ToCommit HEAD

param(
    [Parameter(Position=0)]
    [string]$FromCommit = "",
    
    [Parameter(Position=1)]
    [string]$ToCommit = "HEAD",
    
    [Parameter()]
    [switch]$Force = $false,
    
    [Parameter()]
    [switch]$DryRun = $false,
    
    [Parameter()]
    [string]$PreRelease = "",
    
    [Parameter()]
    [string]$BuildMetadata = ""
)

# Functions
function Show-Help {
    Write-Host "Usage: .\update-version-auto.ps1 [-FromCommit <commit>] [-ToCommit <commit>] [-Force] [-DryRun]"
    Write-Host "Example: .\update-version-auto.ps1 -FromCommit HEAD~5 -ToCommit HEAD"
    Write-Host ""
    Write-Host "Automatically determines version bump based on conventional commits:"
    Write-Host "  [feat] - Increments minor version"
    Write-Host "  [fix] - Increments patch version"
    Write-Host "  [perf] - Increments patch version"
    Write-Host "  BREAKING CHANGE - Increments major version"
    Write-Host "  [major] - Increments major version"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -FromCommit: Starting commit (optional, defaults to last version tag)"
    Write-Host "  -ToCommit: Ending commit (defaults to HEAD)"
    Write-Host "  -Force: Force version bump even without conventional commits"
    Write-Host "  -DryRun: Show what would be done without making changes"
    Write-Host "  -PreRelease: Add pre-release label (e.g., alpha, beta, rc.1)"
    Write-Host "  -BuildMetadata: Add build metadata"
    exit 1
}

function Get-CurrentVersion {
    $versionFile = Join-Path $PSScriptRoot "..\turn-one-backend\VERSION"
    if (Test-Path $versionFile) {
        return (Get-Content -Path $versionFile).Trim()
    }
    return "0.0.0"
}

function Parse-Version {
    param([string]$version)
    
    if ($version -match "^(\d+)\.(\d+)\.(\d+)(-([^+]+))?(\+(.+))?$") {
        return @{
            Major = [int]$Matches[1]
            Minor = [int]$Matches[2]
            Patch = [int]$Matches[3]
            PreRelease = if ($Matches.ContainsKey(5)) { $Matches[5] } else { "" }
            BuildMetadata = if ($Matches.ContainsKey(7)) { $Matches[7] } else { "" }
        }
    }
    return @{ Major = 0; Minor = 0; Patch = 0; PreRelease = ""; BuildMetadata = "" }
}

function Get-LatestVersionTag {
    try {
        $tags = git tag -l "v*" --sort=-version:refname 2>$null
        if ($tags) {
            return ($tags | Select-Object -First 1)
        }
    }
    catch {
        # No tags exist yet
    }
    return $null
}

function Get-CommitMessages {
    param(
        [string]$from,
        [string]$to
    )
    
    # If no from commit specified, try to get the last version tag
    if (-not $from) {
        $lastTag = Get-LatestVersionTag
        if ($lastTag) {
            $from = $lastTag
        }
        else {
            # Get all commits
            $from = (git rev-list --max-parents=0 HEAD 2>$null)
        }
    }
    
    $commits = @()
    $commitRange = if ($from) { "$from..$to" } else { $to }
    
    try {
        $commitList = git log $commitRange --pretty=format:"%H|%s|%b" 2>$null
        
        if ($commitList) {
            $commitLines = $commitList -split "`n"
            $currentCommit = $null
            
            foreach ($line in $commitLines) {
                if ($line -match "^([a-f0-9]{40})\|(.+)\|(.*)$") {
                    if ($currentCommit) {
                        $commits += $currentCommit
                    }
                    $currentCommit = @{
                        Hash = $Matches[1]
                        Subject = $Matches[2]
                        Body = $Matches[3]
                    }
                }
                elseif ($currentCommit -and $line) {
                    $currentCommit.Body += "`n$line"
                }
            }
            
            if ($currentCommit) {
                $commits += $currentCommit
            }
        }
    }
    catch {
        Write-Host "Error retrieving commits: $_" -ForegroundColor Red
    }
    
    return $commits
}

function Get-ConventionalCommitType {
    param([string]$message)
    
    # Check for conventional commit format: type(scope): description
    if ($message -match "^\[?(feat|feature)\]?(\(.+\))?:?\s+(.+)$") {
        return "feat"
    }
    if ($message -match "^\[?fix\]?(\(.+\))?:?\s+(.+)$") {
        return "fix"
    }
    if ($message -match "^\[?perf(ormance)?\]?(\(.+\))?:?\s+(.+)$") {
        return "perf"
    }
    if ($message -match "^\[?major\]?(\(.+\))?:?\s+(.+)$") {
        return "major"
    }
    if ($message -match "^\[?(docs|chore|style|refactor|test|build|ci)\]?(\(.+\))?:?\s+(.+)$") {
        return $Matches[1]
    }
    
    return "unknown"
}

function Analyze-Commits {
    param([array]$commits)
    
    $analysis = @{
        HasBreaking = $false
        HasMajor = $false
        HasFeature = $false
        HasFix = $false
        Features = @()
        Fixes = @()
        Breaking = @()
        Other = @()
    }
    
    foreach ($commit in $commits) {
        $subject = $commit.Subject
        $body = $commit.Body
        $fullMessage = "$subject`n$body"
        
        # Check for breaking changes
        if ($fullMessage -match "BREAKING CHANGE[:]\s*(.+)" -or 
            $subject -match "^.+![:]\s*(.+)" -or
            $fullMessage -match "\[breaking\]" -or
            $fullMessage -match "breaking:") {
            $analysis.HasBreaking = $true
            $analysis.Breaking += @{
                Message = $subject
                Hash = $commit.Hash.Substring(0, 7)
            }
            continue
        }
        
        $type = Get-ConventionalCommitType -message $subject
        
        switch ($type) {
            "major" {
                $analysis.HasMajor = $true
                $analysis.Breaking += @{
                    Message = $subject
                    Hash = $commit.Hash.Substring(0, 7)
                }
            }
            "feat" {
                $analysis.HasFeature = $true
                $analysis.Features += @{
                    Message = $subject
                    Hash = $commit.Hash.Substring(0, 7)
                }
            }
            "fix" {
                $analysis.HasFix = $true
                $analysis.Fixes += @{
                    Message = $subject
                    Hash = $commit.Hash.Substring(0, 7)
                }
            }
            "perf" {
                $analysis.HasFix = $true
                $analysis.Fixes += @{
                    Message = $subject
                    Hash = $commit.Hash.Substring(0, 7)
                }
            }
            default {
                $analysis.Other += @{
                    Message = $subject
                    Hash = $commit.Hash.Substring(0, 7)
                    Type = $type
                }
            }
        }
    }
    
    return $analysis
}

function Determine-VersionBump {
    param([hashtable]$analysis)
    
    if ($analysis.HasBreaking -or $analysis.HasMajor) {
        return "major"
    }
    elseif ($analysis.HasFeature) {
        return "minor"
    }
    elseif ($analysis.HasFix) {
        return "patch"
    }
    else {
        return "none"
    }
}

function Update-VersionFile {
    param(
        [string]$newVersion,
        [string]$versionFilePath
    )
    
    Set-Content -Path $versionFilePath -Value $newVersion -NoNewline
    Write-Host "✓ Updated VERSION file to $newVersion" -ForegroundColor Green
}

function Update-PackageJson {
    param(
        [string]$newVersion,
        [string]$packageJsonPath
    )
    
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
        $packageJson.version = $newVersion
        $packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath
        Write-Host "✓ Updated package.json to $newVersion" -ForegroundColor Green
    }
}

function Generate-ChangelogEntry {
    param(
        [string]$version,
        [hashtable]$analysis,
        [string]$date
    )
    
    $entry = "## [$version] - $date`n`n"
    
    if ($analysis.Breaking.Count -gt 0) {
        $entry += "### 💥 BREAKING CHANGES`n`n"
        foreach ($item in $analysis.Breaking) {
            $cleanMessage = $item.Message -replace "^\[?(major|breaking)\]?:?\s*", ""
            $entry += "- $cleanMessage ($($item.Hash))`n"
        }
        $entry += "`n"
    }
    
    if ($analysis.Features.Count -gt 0) {
        $entry += "### ✨ Features`n`n"
        foreach ($item in $analysis.Features) {
            $cleanMessage = $item.Message -replace "^\[?feat(ure)?\]?:?\s*", ""
            $entry += "- $cleanMessage ($($item.Hash))`n"
        }
        $entry += "`n"
    }
    
    if ($analysis.Fixes.Count -gt 0) {
        $entry += "### 🐛 Bug Fixes`n`n"
        foreach ($item in $analysis.Fixes) {
            $cleanMessage = $item.Message -replace "^\[?fix\]?:?\s*", ""
            $entry += "- $cleanMessage ($($item.Hash))`n"
        }
        $entry += "`n"
    }
    
    if ($analysis.Other.Count -gt 0) {
        $entry += "### 🔧 Other Changes`n`n"
        foreach ($item in $analysis.Other) {
            $entry += "- $($item.Message) ($($item.Hash))`n"
        }
        $entry += "`n"
    }
    
    return $entry
}

function Update-Changelog {
    param(
        [string]$version,
        [hashtable]$analysis,
        [string]$changelogPath
    )
    
    $date = Get-Date -Format "yyyy-MM-dd"
    $entry = Generate-ChangelogEntry -version $version -analysis $analysis -date $date
    
    if (Test-Path $changelogPath) {
        $existingContent = Get-Content $changelogPath -Raw
        
        # Insert new entry after the header
        if ($existingContent -match "(# Changelog.*?)(\n\n)(## \[.*)") {
            $newContent = $Matches[1] + "`n`n" + $entry + $Matches[3]
        }
        else {
            $newContent = $existingContent + "`n`n" + $entry
        }
        
        Set-Content -Path $changelogPath -Value $newContent -NoNewline
    }
    else {
        $header = "# Changelog`n`nAll notable changes to this project will be documented in this file.`n`nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).`n`n"
        Set-Content -Path $changelogPath -Value ($header + $entry) -NoNewline
    }
    
    Write-Host "✓ Updated CHANGELOG.md" -ForegroundColor Green
}

# Main execution
Write-Host "`n🔍 Analyzing commits for version update...`n" -ForegroundColor Cyan

$commits = Get-CommitMessages -from $FromCommit -to $ToCommit

if ($commits.Count -eq 0) {
    Write-Host "No commits found in range." -ForegroundColor Yellow
    if (-not $Force) {
        Write-Host "Use -Force to bump version anyway." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Found $($commits.Count) commit(s)`n" -ForegroundColor Gray

$analysis = Analyze-Commits -commits $commits
$bumpType = Determine-VersionBump -analysis $analysis

if ($bumpType -eq "none" -and -not $Force) {
    Write-Host "No version bump needed (no feat/fix/breaking commits found)." -ForegroundColor Yellow
    Write-Host "Use -Force to bump version anyway." -ForegroundColor Yellow
    exit 0
}

if ($bumpType -eq "none") {
    $bumpType = "patch"
    Write-Host "Force flag set, defaulting to patch bump`n" -ForegroundColor Yellow
}

# Calculate new version
$currentVersion = Get-CurrentVersion
$versionInfo = Parse-Version -version $currentVersion

Write-Host "Current version: $currentVersion" -ForegroundColor Gray
Write-Host "Bump type: $bumpType`n" -ForegroundColor Cyan

switch ($bumpType) {
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
}

$newVersion = "$($versionInfo.Major).$($versionInfo.Minor).$($versionInfo.Patch)"
if ($PreRelease) {
    $newVersion += "-$PreRelease"
}
if ($BuildMetadata) {
    $newVersion += "+$BuildMetadata"
}

Write-Host "New version: $newVersion`n" -ForegroundColor Green

# Display changes summary
if ($analysis.Breaking.Count -gt 0) {
    Write-Host "💥 Breaking Changes: $($analysis.Breaking.Count)" -ForegroundColor Red
}
if ($analysis.Features.Count -gt 0) {
    Write-Host "✨ Features: $($analysis.Features.Count)" -ForegroundColor Green
}
if ($analysis.Fixes.Count -gt 0) {
    Write-Host "🐛 Fixes: $($analysis.Fixes.Count)" -ForegroundColor Yellow
}
if ($analysis.Other.Count -gt 0) {
    Write-Host "🔧 Other: $($analysis.Other.Count)" -ForegroundColor Gray
}
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN - No changes will be made`n" -ForegroundColor Cyan
    
    Write-Host "Would update:`n" -ForegroundColor Gray
    Write-Host "  - turn-one-backend/VERSION → $newVersion"
    Write-Host "  - turn-one-client/package.json → $newVersion"
    Write-Host "  - CHANGELOG.md (add new entry)"
    Write-Host "`nChangelog entry preview:`n" -ForegroundColor Gray
    
    $date = Get-Date -Format "yyyy-MM-dd"
    $entry = Generate-ChangelogEntry -version $newVersion -analysis $analysis -date $date
    Write-Host $entry -ForegroundColor DarkGray
    
    exit 0
}

# Update version files
$scriptRoot = $PSScriptRoot
$versionFilePath = Join-Path $scriptRoot "..\turn-one-backend\VERSION"
$packageJsonPath = Join-Path $scriptRoot "..\turn-one-client\package.json"
$changelogPath = Join-Path $scriptRoot "..\CHANGELOG.md"

Update-VersionFile -newVersion $newVersion -versionFilePath $versionFilePath
Update-PackageJson -newVersion $newVersion -packageJsonPath $packageJsonPath
Update-Changelog -version $newVersion -analysis $analysis -changelogPath $changelogPath

Write-Host "`n✅ Version update complete!`n" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  git add turn-one-backend/VERSION turn-one-client/package.json CHANGELOG.md"
Write-Host "  git commit -m 'chore: bump version to $newVersion'"
Write-Host "  git tag v$newVersion"
Write-Host "  git push && git push --tags"
Write-Host ""
