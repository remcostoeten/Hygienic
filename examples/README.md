# Examples

> Note: These examples use `require('../dist/index.js')` for local testing. When published, use `require('@remcostoeten/hygienic')` instead.

## Basic Usage

```bash
node basic-usage.js
```

Simple script showing how to use the API programmatically.

## Vite Plugin

```bash
# Copy vite-plugin.js to your project
# Add to vite.config.js
```

Auto-consolidate imports during build.

## CI Check

```bash
node ci-check.js
```

Script for CI/CD to fail if imports need consolidation.

## Sample Project

The `sample-project/` directory contains example files:

- `LoginForm.tsx` - Component with individual imports
- `ui/index.ts` - Barrel file exporting components

Run hygienic on this directory to see it in action:

```bash
# From the examples directory
hygienic sample-project/src/ --fix
```
