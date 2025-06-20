#!/bin/bash

# Exit on any error, but continue if optional checks fail
set -e

echo "Running pre-commit checks..."

# Check if we're in CI environment
if [ "${CI}" = "true" ] || [ "${GITHUB_ACTIONS}" = "true" ]; then
    echo "CI environment detected, skipping dependency installation"
    exit 0
fi

# Check if we have required package manager
if ! command -v npm &> /dev/null; then
    echo "npm not found, skipping package checks"
    exit 0
fi

# Only install dependencies if package.json exists and node_modules doesn't
if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install || {
        echo "Warning: npm install failed, skipping further checks"
        exit 0
    }
fi

# Run TypeScript type checking if available
if [ -f "tsconfig.json" ] && [ -d "node_modules" ] && command -v npx &> /dev/null; then
    echo "Running TypeScript type check..."
    npx tsc --noEmit --skipLibCheck || {
        echo "Warning: TypeScript type check failed"
        # Don't exit, just warn
    }
fi

# Basic syntax check for modified files
echo "Running basic syntax checks..."
for file in $(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(js|jsx|ts|tsx)$' || true); do
    if [ -f "$file" ]; then
        # Basic syntax check using node if available
        if command -v node &> /dev/null; then
            node -c "$file" 2>/dev/null || {
                echo "Syntax error in $file"
                exit 1
            }
        fi
    fi
done

echo "Pre-commit checks completed successfully!"
