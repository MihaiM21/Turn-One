# Commit Message Validation

This guide shows how to validate commit messages to ensure they follow our conventional commit standards.

## Local Git Hook (Pre-commit)

Create `.git/hooks/commit-msg` to validate commit messages locally:

```bash
#!/bin/bash

# commit-msg hook to validate conventional commit format

commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Pattern for conventional commits
pattern='^\[(feat|fix|perf|docs|style|refactor|test|chore|build|ci|major)\]:|^(feat|fix|perf|docs|style|refactor|test|chore|build|ci)(\(.+\))?:'

# Also allow merge commits
if echo "$commit_msg" | grep -qE "^Merge"; then
    exit 0
fi

# Also allow version bump commits
if echo "$commit_msg" | grep -qE "^(chore|release): (bump|release) version"; then
    exit 0
fi

# Validate commit message
if ! echo "$commit_msg" | grep -qE "$pattern"; then
    echo "❌ Invalid commit message format!"
    echo ""
    echo "Commit message must follow conventional commit format:"
    echo "  [type]: description"
    echo "  or"
    echo "  type(scope): description"
    echo ""
    echo "Valid types: feat, fix, perf, docs, style, refactor, test, chore, build, ci, major"
    echo ""
    echo "Examples:"
    echo "  [feat]: Add race telemetry dashboard"
    echo "  fix(auth): resolve token expiration issue"
    echo "  [fix]: Correct lap time calculation"
    echo ""
    echo "See docs/COMMIT_CONVENTIONS.md for more details."
    exit 1
fi

exit 0
```

Make it executable:

```bash
chmod +x .git/hooks/commit-msg
```

## PowerShell Git Hook

For Windows users, create `.git/hooks/commit-msg.ps1`:

```powershell
# commit-msg hook to validate conventional commit format
param([string]$CommitMsgFile)

$commitMsg = Get-Content $CommitMsgFile -Raw

# Pattern for conventional commits
$pattern = '^\[(feat|fix|perf|docs|style|refactor|test|chore|build|ci|major)\]:|^(feat|fix|perf|docs|style|refactor|test|chore|build|ci)(\(.+\))?:'

# Allow merge commits
if ($commitMsg -match "^Merge") {
    exit 0
}

# Allow version bump commits
if ($commitMsg -match "^(chore|release): (bump|release) version") {
    exit 0
}

# Validate commit message
if ($commitMsg -notmatch $pattern) {
    Write-Host "❌ Invalid commit message format!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Commit message must follow conventional commit format:"
    Write-Host "  [type]: description"
    Write-Host "  or"
    Write-Host "  type(scope): description"
    Write-Host ""
    Write-Host "Valid types: feat, fix, perf, docs, style, refactor, test, chore, build, ci, major"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  [feat]: Add race telemetry dashboard"
    Write-Host "  fix(auth): resolve token expiration issue"
    Write-Host "  [fix]: Correct lap time calculation"
    Write-Host ""
    Write-Host "See docs/COMMIT_CONVENTIONS.md for more details."
    exit 1
}

exit 0
```

And create `.git/hooks/commit-msg` (batch wrapper):

```batch
@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0commit-msg.ps1" %*
```

## GitHub Actions Validation

Create `.github/workflows/validate-commits.yml`:

```yaml
name: Validate Commit Messages

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate-commits:
    runs-on: ubuntu-latest
    name: Validate Conventional Commits
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Validate commit messages
        run: |
          # Get all commits in the PR
          commits=$(git log --format=%H origin/${{ github.base_ref }}..HEAD)
          
          # Pattern for conventional commits
          pattern='^\[(feat|fix|perf|docs|style|refactor|test|chore|build|ci|major)\]:|^(feat|fix|perf|docs|style|refactor|test|chore|build|ci)(\(.+\))?:'
          
          invalid_commits=()
          
          for commit in $commits; do
            msg=$(git log --format=%s -n 1 $commit)
            
            # Skip merge commits
            if [[ $msg =~ ^Merge ]]; then
              continue
            fi
            
            # Skip version bump commits
            if [[ $msg =~ ^(chore|release):[[:space:]]*(bump|release)[[:space:]]*version ]]; then
              continue
            fi
            
            # Validate
            if ! echo "$msg" | grep -qE "$pattern"; then
              invalid_commits+=("$commit: $msg")
            fi
          done
          
          if [ ${#invalid_commits[@]} -gt 0 ]; then
            echo "❌ Invalid commit messages found:"
            printf '%s\n' "${invalid_commits[@]}"
            echo ""
            echo "Commit messages must follow conventional commit format:"
            echo "  [type]: description"
            echo "  or"
            echo "  type(scope): description"
            echo ""
            echo "Valid types: feat, fix, perf, docs, style, refactor, test, chore, build, ci, major"
            echo ""
            echo "See docs/COMMIT_CONVENTIONS.md for details."
            exit 1
          fi
          
          echo "✅ All commit messages are valid!"
```

## Using Commitlint (Advanced)

For more advanced validation, use commitlint:

### Install

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### Configure

Create `commitlint.config.js`:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'perf',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'build',
        'ci',
        'major'
      ]
    ],
    'subject-case': [0], // Allow any case
    'type-case': [0], // Allow any case for type
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never']
  },
  parserPreset: {
    parserOpts: {
      // Support both [type]: and type: formats
      headerPattern: /^(?:\[(\w+)\]|(\w+)(?:\(([^)]*)\))?):\s(.+)$/,
      headerCorrespondence: ['type1', 'type2', 'scope', 'subject']
    }
  }
};
```

### Husky Integration

```bash
# Install husky
npm install --save-dev husky

# Initialize husky
npx husky init

# Add commit-msg hook
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
chmod +x .husky/commit-msg
```

## VS Code Extension

Install the **Conventional Commits** extension:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Conventional Commits"
4. Install the extension by vivaxy

This provides:
- Guided commit message creation
- Type selection dropdown
- Scope assistance
- Breaking change prompts

## Summary

Choose the validation approach that best fits your workflow:

| Method | Pros | Cons |
|--------|------|------|
| **Git Hook** | Local, fast, no dependencies | Must set up per clone |
| **GitHub Actions** | Enforced on PRs, no local setup | Only validates on push |
| **Commitlint** | Comprehensive, customizable | Requires Node.js setup |
| **VS Code Extension** | User-friendly GUI | Only for VS Code users |

**Recommended**: Combine Git hooks for local validation and GitHub Actions for enforcement.
