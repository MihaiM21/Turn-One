# GitHub Actions Integration Guide

This guide explains how the versioning system integrates with GitHub Actions CI/CD pipelines.

## 📋 Available Workflows

### 1. **validate-commits.yml** - Commit Message Validation

**Trigger:** On every pull request (opened, synchronized, reopened)

**Purpose:** Validates that all commits follow conventional commit format

**What it does:**
- Fetches all commits in the PR
- Validates each commit message against conventional commit pattern
- Skips merge commits and version bump commits
- Fails the PR if invalid commits are found
- Provides helpful error messages with examples

**Example output:**
```
🔍 Validating commit messages...
  ✅ Valid: [feat]: Add race strategy analyzer
  ✅ Valid: fix(auth): resolve token issue
  ❌ $commit: update stuff

❌ Invalid commit messages found:
  ❌ abc123: update stuff

📝 Commit messages must follow conventional commit format...
```

**Usage:**
- Automatically runs on all PRs
- Prevents merging of PRs with invalid commit messages
- Helps maintain commit message standards

---

### 2. **release-version.yml** - Automated Release Creation

**Trigger:** Manual dispatch (workflow_dispatch)

**Purpose:** Creates a new version release with automated or manual version bumping

**Inputs:**
- `bump_type`: Choose version bump type (auto, major, minor, patch)
- `pre_release`: Optional pre-release label (e.g., beta.1, rc.1)

**What it does:**
1. Checks out code with full git history
2. Gets current version from VERSION file
3. Runs automated version update script
4. Updates VERSION, package.json, and CHANGELOG.md
5. Commits the version changes
6. Creates and pushes git tag
7. Extracts changelog for the new version
8. Creates GitHub release with release notes

**Usage:**

#### Option 1: Automatic Version Detection (Recommended)
```
1. Go to Actions tab in GitHub
2. Select "Release Version" workflow
3. Click "Run workflow"
4. Leave bump_type as "auto" or empty
5. Click "Run workflow"
```

The workflow will:
- Analyze commits since last tag
- Determine appropriate version bump
- Update all version files
- Create release with changelog

#### Option 2: Manual Version Bump
```
1. Go to Actions tab in GitHub
2. Select "Release Version" workflow
3. Click "Run workflow"
4. Select bump_type: major, minor, or patch
5. Click "Run workflow"
```

#### Option 3: Pre-release
```
1. Go to Actions tab in GitHub
2. Select "Release Version" workflow
3. Click "Run workflow"
4. Set bump_type to "auto" or specific type
5. Enter pre_release: "beta.1" (or "rc.1", "alpha.2", etc.)
6. Click "Run workflow"
```

**Output:**
- New git tag (e.g., v1.2.0)
- GitHub Release with extracted changelog
- Updated VERSION and package.json files
- Workflow summary with version change details

---

### 3. **simple-ci.yml** - Basic CI Pipeline

**Trigger:** Push to main branch, Pull requests to main

**Purpose:** Build and test the application

**What it does:**
- Sets up .NET 9 and Node.js 20
- Restores dependencies
- Builds backend and frontend
- Runs tests

**Updated:** Now uses correct paths (turn-one-backend/turn-one-client)

---

### 4. **pipeline.yml** - Dual Environment CI/CD

**Trigger:** Push to master or dev branches

**Purpose:** Comprehensive build, test, and deployment pipeline

**Features:**
- Multi-environment support (staging/production)
- Docker builds
- Automated deployments
- Health checks

---

## 🔄 Complete Release Workflow

### Workflow Diagram

```
Developer → Commits → PR → CI Validation → Merge → Release Workflow → Deploy
```

### Step-by-Step Process

#### 1. Development Phase
```bash
# Developer creates feature branch
git checkout -b feature/new-dashboard

# Makes commits with conventional format
git commit -m "[feat]: Add user dashboard"
git commit -m "[fix]: Resolve data loading issue"

# Pushes to GitHub
git push origin feature/new-dashboard
```

#### 2. Pull Request Phase
```
# Developer creates PR
→ GitHub Actions automatically runs:
  ✅ validate-commits.yml (validates commit messages)
  ✅ simple-ci.yml (builds and tests)

# If validation fails:
  ❌ PR cannot be merged
  → Developer fixes commit messages
  
# If validation passes:
  ✅ PR can be merged
```

#### 3. Release Phase (After Merge)
```
# Option A: Manual GitHub Actions
1. Go to Actions → "Release Version"
2. Click "Run workflow"
3. Select "auto" bump type
4. Workflow runs:
   - Analyzes commits
   - Determines version (1.0.0 → 1.1.0)
   - Updates files
   - Creates tag and release

# Option B: Local Release (Alternative)
./scripts/update-version-auto.ps1
git push && git push --tags
# Then manually create GitHub release
```

#### 4. Deployment Phase
```
# Triggered by new tag
→ pipeline.yml workflow:
  ✅ Builds Docker images
  ✅ Runs tests
  ✅ Deploys to staging
  ✅ Manual approval for production
  ✅ Deploys to production
```

---

## 🛠️ Setup Instructions

### Enable Workflows

1. All workflow files are in `.github/workflows/`
2. They're automatically enabled when pushed to GitHub
3. No additional setup required

### Required Permissions

The **release-version.yml** workflow needs:
- `contents: write` - To create tags and releases

This is already configured in the workflow file.

### Secrets (Optional)

For advanced features, you may want to add:
- `GITHUB_TOKEN` - Automatically provided by GitHub
- Custom deployment secrets (if using automated deployments)

---

## 📊 Workflow Status Badges

Add these badges to your README.md:

```markdown
[![Validate Commits](https://github.com/USERNAME/REPO/actions/workflows/validate-commits.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/validate-commits.yml)

[![Release Version](https://github.com/USERNAME/REPO/actions/workflows/release-version.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/release-version.yml)

[![CI Pipeline](https://github.com/USERNAME/REPO/actions/workflows/simple-ci.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/simple-ci.yml)
```

Replace `USERNAME/REPO` with your repository path.

---

## 🔒 Branch Protection Rules

Recommended branch protection for `main`/`master`:

1. Go to Settings → Branches → Branch protection rules
2. Add rule for `main` (or `master`)
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select status checks:
     - `🔍 Validate Conventional Commits`
     - `🏗️ Build & Test`
   - ✅ Require conversation resolution before merging

This ensures:
- All commits follow conventions
- All tests pass
- Code is reviewed

---

## 🧪 Testing Workflows Locally

### Test Commit Validation Locally

```bash
# Create a test branch
git checkout -b test-commits

# Make test commits
git commit --allow-empty -m "[feat]: Test feature"
git commit --allow-empty -m "bad commit"

# Push to GitHub
git push origin test-commits

# Create PR and see validation fail on "bad commit"
```

### Test Release Workflow (Dry Run)

```bash
# Test locally first
./scripts/update-version-auto.ps1 -DryRun

# If satisfied, trigger GitHub workflow
# or push tag manually
```

---

## 🐛 Troubleshooting

### Issue: Commit validation workflow not running

**Solution:**
- Ensure `.github/workflows/validate-commits.yml` exists
- Check that PR is targeting the correct base branch
- Verify GitHub Actions are enabled for the repository

### Issue: Release workflow fails to push

**Solution:**
- Check that `contents: write` permission is set
- Verify no branch protection rules block bot commits
- Check workflow logs for detailed error

### Issue: Version update script not found

**Solution:**
- Ensure scripts are executable: `chmod +x scripts/*.sh`
- Verify scripts exist in repository
- Check paths in workflow file

---

## 📈 Advanced: Automated Release on Merge

If you want releases to be fully automated on merge to main:

Create `.github/workflows/auto-release.yml`:

```yaml
name: Auto Release on Merge

on:
  push:
    branches: [main, master]

jobs:
  auto-release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Check if version bump needed
        id: check
        run: |
          chmod +x scripts/update-version-auto.sh
          
          # Check if there are any commits that would trigger a bump
          if ./scripts/update-version-auto.sh --dry-run | grep -q "version bump needed"; then
            echo "needs_bump=true" >> $GITHUB_OUTPUT
          else
            echo "needs_bump=false" >> $GITHUB_OUTPUT
          fi
      
      - name: Create release
        if: steps.check.outputs.needs_bump == 'true'
        run: |
          # Run version update
          ./scripts/update-version-auto.sh
          
          # Commit and push
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          
          NEW_VERSION=$(cat turn-one-backend/VERSION)
          
          git add turn-one-backend/VERSION turn-one-client/package.json CHANGELOG.md
          git commit -m "chore: bump version to $NEW_VERSION"
          git push
          
          git tag "v$NEW_VERSION"
          git push origin "v$NEW_VERSION"
```

**Warning:** This creates a release on every merge. Consider if this fits your workflow.

---

## 📚 Related Documentation

- [Commit Conventions](./COMMIT_CONVENTIONS.md)
- [Versioning Guide](./VERSIONING.md)
- [Quick Reference](./QUICK_REFERENCE_VERSIONING.md)
- [Workflow Diagram](./VERSIONING_WORKFLOW.md)

---

## ✅ Summary

The versioning system now integrates with GitHub Actions to:

✅ **Validate** commit messages on every PR  
✅ **Automate** version bumping with one click  
✅ **Generate** changelogs automatically  
✅ **Create** GitHub releases with proper tags  
✅ **Maintain** version consistency across files  

All while enforcing best practices and providing clear feedback to developers!
