#!/bin/bash

# Script to update the version of Turn One
# Usage: ./update-version.sh [major|minor|patch] [pre-release] [build-metadata]
# Example: ./update-version.sh patch beta.1 build.123

# Functions
function show_help {
    echo "Usage: ./update-version.sh [major|minor|patch] [pre-release] [build-metadata] [release-notes]"
    echo "Example: ./update-version.sh patch beta.1 build.123 \"Fixed bug in telemetry\""
    echo ""
    echo "Updates the version according to semantic versioning:"
    echo "  - major: Increments major version, resets minor and patch to 0"
    echo "  - minor: Increments minor version, resets patch to 0"
    echo "  - patch: Increments patch version"
    echo "  - pre-release: Optional pre-release label (alpha, beta, etc.)"
    echo "  - build-metadata: Optional build metadata"
    echo "  - release-notes: Optional release notes"
    exit 1
}

function get_current_version {
    cat VERSION
}

function parse_version {
    local version=$1
    local major=$(echo $version | cut -d. -f1)
    local minor=$(echo $version | cut -d. -f2)
    local patch_plus=$(echo $version | cut -d. -f3)
    
    # Extract patch, pre-release and build metadata
    local patch=$(echo $patch_plus | cut -d- -f1 | cut -d+ -f1)
    local pre_release=""
    if [[ $patch_plus == *"-"* ]]; then
        pre_release=$(echo $patch_plus | cut -d- -f2 | cut -d+ -f1)
    fi
    local build_metadata=""
    if [[ $patch_plus == *"+"* ]]; then
        build_metadata=$(echo $patch_plus | cut -d+ -f2)
    fi

    echo "$major $minor $patch $pre_release $build_metadata"
}

function update_version {
    local current_version=$(get_current_version)
    read -r major minor patch pre_release build_metadata <<< $(parse_version "$current_version")
    
    case $1 in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            show_help
            ;;
    esac
    
    # Apply pre-release and build-metadata if provided
    local new_version="$major.$minor.$patch"
    if [ ! -z "$2" ]; then
        new_version="$new_version-$2"
    fi
    if [ ! -z "$3" ]; then
        new_version="$new_version+$3"
    fi
    
    echo "$new_version" > VERSION
    echo "Version updated from $current_version to $new_version"
    
    # If the backend API is available, update it via API
    if [ ! -z "$API_URL" ]; then
        local release_notes=${4:-"Version update"}
        echo "Updating version in API..."
        curl -X POST "$API_URL/api/version/update" \
             -H "Content-Type: application/json" \
             -H "Authorization: Bearer $API_TOKEN" \
             -d "{\"major\":$major,\"minor\":$minor,\"patch\":$patch,\"preRelease\":\"$2\",\"buildMetadata\":\"$3\",\"releaseNotes\":\"$release_notes\"}"
    fi
    
    echo "Don't forget to commit and tag this version:"
    echo "git add VERSION"
    echo "git commit -m \"Bump version to $new_version\""
    echo "git tag v$new_version"
    echo "git push && git push --tags"
}

# Main
if [ "$1" == "-h" ] || [ "$1" == "--help" ] || [ -z "$1" ]; then
    show_help
else
    update_version "$1" "$2" "$3" "$4"
fi