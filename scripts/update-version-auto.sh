#!/bin/bash

# Script to automatically update version based on conventional commits
# Usage: ./update-version-auto.sh [-f commit] [-t commit] [--force] [--dry-run]
# Example: ./update-version-auto.sh -f HEAD~5 -t HEAD

# Default values
FROM_COMMIT=""
TO_COMMIT="HEAD"
FORCE=false
DRY_RUN=false
PRE_RELEASE=""
BUILD_METADATA=""
AUTO_PR=false
PR_BASE_BRANCH="main"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--from)
            FROM_COMMIT="$2"
            shift 2
            ;;
        -t|--to)
            TO_COMMIT="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -p|--pre-release)
            PRE_RELEASE="$2"
            shift 2
            ;;
        -b|--build)
            BUILD_METADATA="$2"
            shift 2
            ;;
        --auto-pr)
            AUTO_PR=true
            shift
            ;;
        --pr-base)
            PR_BASE_BRANCH="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: ./update-version-auto.sh [-f commit] [-t commit] [--force] [--dry-run]"
            echo "Example: ./update-version-auto.sh -f HEAD~5 -t HEAD"
            echo ""
            echo "Automatically determines version bump based on conventional commits:"
            echo "  [feat] - Increments minor version"
            echo "  [fix] - Increments patch version"
            echo "  [perf] - Increments patch version"
            echo "  BREAKING CHANGE - Increments major version"
            echo "  [major] - Increments major version"
            echo "  --auto-pr: Automatically create a pull request (requires gh CLI)"
            echo "  --pr-base: Base branch for PR (default: main)"
            echo ""
            echo "Options:"
            echo "  -f, --from: Starting commit (optional, defaults to last version tag)"
            echo "  -t, --to: Ending commit (defaults to HEAD)"
            echo "  --force: Force version bump even without conventional commits"
            echo "  --dry-run: Show what would be done without making changes"
            echo "  -p, --pre-release: Add pre-release label (e.g., alpha, beta, rc.1)"
            echo "  -b, --build: Add build metadata"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Functions
get_current_version() {
    if [ -f "turn-one-backend/VERSION" ]; then
        cat turn-one-backend/VERSION
    else
        echo "0.0.0"
    fi
}

parse_version() {
    local version=$1
    if [[ $version =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)(-([^+]+))?(\+(.+))?$ ]]; then
        MAJOR="${BASH_REMATCH[1]}"
        MINOR="${BASH_REMATCH[2]}"
        PATCH="${BASH_REMATCH[3]}"
        CURRENT_PRE_RELEASE="${BASH_REMATCH[5]}"
        CURRENT_BUILD="${BASH_REMATCH[7]}"
    else
        MAJOR=0
        MINOR=0
        PATCH=0
        CURRENT_PRE_RELEASE=""
        CURRENT_BUILD=""
    fi
}

get_latest_version_tag() {
    git tag -l "v*" --sort=-version:refname 2>/dev/null | head -n 1
}

get_commits() {
    local from=$1
    local to=$2
    
    # If no from commit specified, try to get the last version tag
    if [ -z "$from" ]; then
        local last_tag=$(get_latest_version_tag)
        if [ -n "$last_tag" ]; then
            from=$last_tag
        else
            # Get first commit
            from=$(git rev-list --max-parents=0 HEAD 2>/dev/null)
        fi
    fi
    
    local commit_range
    if [ -n "$from" ]; then
        commit_range="$from..$to"
    else
        commit_range=$to
    fi
    
    git log "$commit_range" --pretty=format:"%H|%s|%b" 2>/dev/null
}

get_commit_type() {
    local message=$1
    
    if [[ $message =~ ^\[?(feat|feature)\]?(\(.+\))?:?[[:space:]]+ ]]; then
        echo "feat"
    elif [[ $message =~ ^\[?fix\]?(\(.+\))?:?[[:space:]]+ ]]; then
        echo "fix"
    elif [[ $message =~ ^\[?perf(ormance)?\]?(\(.+\))?:?[[:space:]]+ ]]; then
        echo "perf"
    elif [[ $message =~ ^\[?major\]?(\(.+\))?:?[[:space:]]+ ]]; then
        echo "major"
    elif [[ $message =~ ^\[?(docs|chore|style|refactor|test|build|ci)\]?(\(.+\))?:?[[:space:]]+ ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "unknown"
    fi
}

# Initialize arrays for storing commits by type
declare -a BREAKING_COMMITS=()
declare -a FEATURE_COMMITS=()
declare -a FIX_COMMITS=()
declare -a OTHER_COMMITS=()

analyze_commits() {
    local commits="$1"
    local has_breaking=false
    local has_feature=false
    local has_fix=false
    
    while IFS='|' read -r hash subject body; do
        [ -z "$hash" ] && continue
        
        local short_hash="${hash:0:7}"
        local full_message="$subject"$'\n'"$body"
        
        # Check for breaking changes
        if [[ $full_message =~ BREAKING[[:space:]]CHANGE: ]] || 
           [[ $subject =~ ^.+!: ]] ||
           [[ $full_message =~ \[breaking\] ]] ||
           [[ $full_message =~ breaking: ]]; then
            BREAKING_COMMITS+=("$short_hash|$subject")
            has_breaking=true
            continue
        fi
        
        local type=$(get_commit_type "$subject")
        
        case $type in
            major)
                BREAKING_COMMITS+=("$short_hash|$subject")
                has_breaking=true
                ;;
            feat)
                FEATURE_COMMITS+=("$short_hash|$subject")
                has_feature=true
                ;;
            fix|perf)
                FIX_COMMITS+=("$short_hash|$subject")
                has_fix=true
                ;;
            *)
                OTHER_COMMITS+=("$short_hash|$subject|$type")
                ;;
        esac
    done <<< "$commits"
    
    # Determine bump type
    if [ "$has_breaking" = true ]; then
        echo "major"
    elif [ "$has_feature" = true ]; then
        echo "minor"
    elif [ "$has_fix" = true ]; then
        echo "patch"
    else
        echo "none"
    fi
}

update_version_file() {
    local version=$1
    local file=$2
    
    echo -n "$version" > "$file"
    echo -e "${GREEN}✓ Updated VERSION file to $version${NC}"
}

update_package_json() {
    local version=$1
    local file=$2
    
    if [ -f "$file" ]; then
        # Use Node.js to update JSON properly
        node -e "
            const fs = require('fs');
            const pkg = JSON.parse(fs.readFileSync('$file', 'utf8'));
            pkg.version = '$version';
            fs.writeFileSync('$file', JSON.stringify(pkg, null, 2) + '\n');
        " 2>/dev/null || {
            # Fallback to sed if Node.js is not available
            sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$file"
            rm -f "${file}.bak"
        }
        echo -e "${GREEN}✓ Updated package.json to $version${NC}"
    fi
}

clean_commit_message() {
    local message=$1
    echo "$message" | sed -E 's/^\[?(major|breaking|feat(ure)?|fix|perf(ormance)?)\]?:?[[:space:]]*//'
}

generate_changelog_entry() {
    local version=$1
    local date=$(date +%Y-%m-%d)
    local entry="## [$version] - $date\n\n"
    
    # Breaking changes
    if [ ${#BREAKING_COMMITS[@]} -gt 0 ]; then
        entry+="### 💥 BREAKING CHANGES\n\n"
        for commit in "${BREAKING_COMMITS[@]}"; do
            IFS='|' read -r hash message <<< "$commit"
            local clean_msg=$(clean_commit_message "$message")
            entry+="- $clean_msg ($hash)\n"
        done
        entry+="\n"
    fi
    
    # Features
    if [ ${#FEATURE_COMMITS[@]} -gt 0 ]; then
        entry+="### ✨ Features\n\n"
        for commit in "${FEATURE_COMMITS[@]}"; do
            IFS='|' read -r hash message <<< "$commit"
            local clean_msg=$(clean_commit_message "$message")
            entry+="- $clean_msg ($hash)\n"
        done
        entry+="\n"
    fi
    
    # Fixes
    if [ ${#FIX_COMMITS[@]} -gt 0 ]; then
        entry+="### 🐛 Bug Fixes\n\n"
        for commit in "${FIX_COMMITS[@]}"; do
            IFS='|' read -r hash message <<< "$commit"
            local clean_msg=$(clean_commit_message "$message")
            entry+="- $clean_msg ($hash)\n"
        done
        entry+="\n"
    fi
    
    # Other changes
    if [ ${#OTHER_COMMITS[@]} -gt 0 ]; then
        entry+="### 🔧 Other Changes\n\n"
        for commit in "${OTHER_COMMITS[@]}"; do
            IFS='|' read -r hash message type <<< "$commit"
            entry+="- $message ($hash)\n"
        done
        entry+="\n"
    fi
    
    echo -e "$entry"
}

update_changelog() {
    local version=$1
    local file=$2
    
    local entry=$(generate_changelog_entry "$version")
    
    if [ -f "$file" ]; then
        # Insert after header
        local header=$(sed -n '1,/^## \[/p' "$file" | sed '$d')
        local rest=$(sed -n '/^## \[/,$p' "$file")
        
        if [ -z "$rest" ]; then
            rest=$(cat "$file")
            echo -e "$rest\n\n$entry" > "$file"
        else
            echo -e "$header\n$entry$rest" > "$file"
        fi
    else
        local header="# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n"
        echo -e "$header$entry" > "$file"
    fi
    
    echo -e "${GREEN}✓ Updated CHANGELOG.md${NC}"
}

# Main execution
echo -e "\n${CYAN}🔍 Analyzing commits for version update...${NC}\n"

commits=$(get_commits "$FROM_COMMIT" "$TO_COMMIT")
commit_count=$(echo "$commits" | grep -c "^" || echo "0")

if [ "$commit_count" -eq 0 ]; then
    echo -e "${YELLOW}No commits found in range.${NC}"
    if [ "$FORCE" = false ]; then
        echo -e "${YELLOW}Use --force to bump version anyway.${NC}"
        exit 0
    fi
fi

echo -e "${GRAY}Found $commit_count commit(s)${NC}\n"

bump_type=$(analyze_commits "$commits")

if [ "$bump_type" = "none" ] && [ "$FORCE" = false ]; then
    echo -e "${YELLOW}No version bump needed (no feat/fix/breaking commits found).${NC}"
    echo -e "${YELLOW}Use --force to bump version anyway.${NC}"
    exit 0
fi

if [ "$bump_type" = "none" ]; then
    bump_type="patch"
    echo -e "${YELLOW}Force flag set, defaulting to patch bump${NC}\n"
fi

# Calculate new version
current_version=$(get_current_version)
parse_version "$current_version"

echo -e "${GRAY}Current version: $current_version${NC}"
echo -e "${CYAN}Bump type: $bump_type${NC}\n"

case $bump_type in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

new_version="$MAJOR.$MINOR.$PATCH"
if [ -n "$PRE_RELEASE" ]; then
    new_version="$new_version-$PRE_RELEASE"
fi
if [ -n "$BUILD_METADATA" ]; then
    new_version="$new_version+$BUILD_METADATA"
fi

echo -e "${GREEN}New version: $new_version${NC}\n"

# Display changes summary
if [ ${#BREAKING_COMMITS[@]} -gt 0 ]; then
    echo -e "${RED}💥 Breaking Changes: ${#BREAKING_COMMITS[@]}${NC}"
fi
if [ ${#FEATURE_COMMITS[@]} -gt 0 ]; then
    echo -e "${GREEN}✨ Features: ${#FEATURE_COMMITS[@]}${NC}"
fi
if [ ${#FIX_COMMITS[@]} -gt 0 ]; then
    echo -e "${YELLOW}🐛 Fixes: ${#FIX_COMMITS[@]}${NC}"
fi
if [ ${#OTHER_COMMITS[@]} -gt 0 ]; then
    echo -e "${GRAY}🔧 Other: ${#OTHER_COMMITS[@]}${NC}"
fi
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${CYAN}DRY RUN - No changes will be made${NC}\n"
    echo -e "${GRAY}Would update:${NC}\n"
    echo "  - turn-one-backend/VERSION → $new_version"
    echo "  - turn-one-client/package.json → $new_version"
    echo "  - CHANGELOG.md (add new entry)"
    echo -e "\n${GRAY}Changelog entry preview:${NC}\n"
    
    generate_changelog_entry "$new_version"
    
    exit 0
fi

# Update version files
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
version_file="$script_dir/../turn-one-backend/VERSION"
package_json="$script_dir/../turn-one-client/package.json"
changelog_file="$script_dir/../CHANGELOG.md"

update_version_file "$new_version" "$version_file"
update_package_json "$new_version" "$package_json"
update_changelog "$new_version" "$changelog_file"

echo -e "\n${GREEN}✅ Version update complete!${NC}\n"

# Handle auto PR creation
if [ "$AUTO_PR" = true ]; then
    echo -e "${CYAN}Creating pull request automatically...${NC}\n"
    
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
        echo "Install it from: https://cli.github.com/"
        echo "Falling back to manual PR instructions."
        AUTO_PR=false
    else
        # Get current branch
        current_branch=$(git rev-parse --abbrev-ref HEAD)
        pr_branch="version-bump-$new_version"
        
        # Create and checkout new branch
        echo -e "${GRAY}Creating branch: $pr_branch${NC}"
        git checkout -b "$pr_branch" 2>/dev/null || {
            echo -e "${YELLOW}Branch already exists, switching to it${NC}"
            git checkout "$pr_branch"
        }
        
        # Stage and commit changes
        echo -e "${GRAY}Committing changes...${NC}"
        git add turn-one-backend/VERSION turn-one-client/package.json CHANGELOG.md
        git commit -m "chore: bump version to $new_version

This PR bumps the version from $current_version to $new_version based on conventional commits.

### Changes Summary:
- Updated VERSION file to $new_version
- Updated package.json to $new_version
- Updated CHANGELOG.md with new entries

### Commits Analyzed:
$([ ${#BREAKING_COMMITS[@]} -gt 0 ] && echo "- 💥 Breaking Changes: ${#BREAKING_COMMITS[@]}")
$([ ${#FEATURE_COMMITS[@]} -gt 0 ] && echo "- ✨ Features: ${#FEATURE_COMMITS[@]}")
$([ ${#FIX_COMMITS[@]} -gt 0 ] && echo "- 🐛 Fixes: ${#FIX_COMMITS[@]}")
$([ ${#OTHER_COMMITS[@]} -gt 0 ] && echo "- 🔧 Other: ${#OTHER_COMMITS[@]}")

Bump type: $bump_type"
        
        # Push branch
        echo -e "${GRAY}Pushing branch to remote...${NC}"
        git push -u origin "$pr_branch"
        
        # Create PR
        echo -e "${GRAY}Creating pull request...${NC}"
        pr_body="## Version Bump: $current_version → $new_version

This automated PR bumps the version based on conventional commits since the last release.

### 📊 Changes Summary

"
        if [ ${#BREAKING_COMMITS[@]} -gt 0 ]; then
            pr_body+="#### 💥 BREAKING CHANGES (${#BREAKING_COMMITS[@]})
"
            for commit in "${BREAKING_COMMITS[@]}"; do
                IFS='|' read -r hash message <<< "$commit"
                clean_msg=$(clean_commit_message "$message")
                pr_body+="- $clean_msg (\`$hash\`)
"
            done
            pr_body+="
"
        fi
        
        if [ ${#FEATURE_COMMITS[@]} -gt 0 ]; then
            pr_body+="#### ✨ Features (${#FEATURE_COMMITS[@]})
"
            for commit in "${FEATURE_COMMITS[@]}"; do
                IFS='|' read -r hash message <<< "$commit"
                clean_msg=$(clean_commit_message "$message")
                pr_body+="- $clean_msg (\`$hash\`)
"
            done
            pr_body+="
"
        fi
        
        if [ ${#FIX_COMMITS[@]} -gt 0 ]; then
            pr_body+="#### 🐛 Bug Fixes (${#FIX_COMMITS[@]})
"
            for commit in "${FIX_COMMITS[@]}"; do
                IFS='|' read -r hash message <<< "$commit"
                clean_msg=$(clean_commit_message "$message")
                pr_body+="- $clean_msg (\`$hash\`)
"
            done
            pr_body+="
"
        fi
        
        pr_body+="### 📝 Files Updated
- \`turn-one-backend/VERSION\`
- \`turn-one-client/package.json\`
- \`CHANGELOG.md\`

### ✅ Review Checklist
- [ ] Version number is correct
- [ ] CHANGELOG.md entries are accurate
- [ ] All version files are updated consistently

**Bump Type:** $bump_type  
**Previous Version:** $current_version  
**New Version:** $new_version

---
*This PR was automatically generated by the version bump automation.*"
        
        gh pr create \
            --base "$PR_BASE_BRANCH" \
            --head "$pr_branch" \
            --title "chore: bump version to $new_version" \
            --body "$pr_body" \
            --label "version-bump,automated" 2>/dev/null || {
            echo -e "${YELLOW}Failed to create PR via GitHub CLI${NC}"
            AUTO_PR=false
        }
        
        if [ "$AUTO_PR" = true ]; then
            echo -e "\n${GREEN}✅ Pull request created successfully!${NC}\n"
            echo -e "${CYAN}View PR:${NC}"
            gh pr view --web
        fi
    fi
fi

if [ "$AUTO_PR" = false ]; then
    echo -e "${CYAN}Next steps (Manual PR Mode):${NC}"
    echo "  1. Create branch: git checkout -b version-bump-$new_version"
    echo "  2. Commit changes: git add turn-one-backend/VERSION turn-one-client/package.json CHANGELOG.md"
    echo "  3. Commit: git commit -m 'chore: bump version to $new_version'"
    echo "  4. Push: git push -u origin version-bump-$new_version"
    echo "  5. Create PR via GitHub CLI: gh pr create --base $PR_BASE_BRANCH --title 'chore: bump version to $new_version'"
    echo ""
fi

