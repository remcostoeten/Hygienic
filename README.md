# UI Import Consolidator

A Node.js CLI tool to consolidate UI component imports from barrel files in TypeScript/React projects.

## Installation

```bash
npm install -g ui-import-consolidator
```

Or use with npx:

```bash
npx ui-import-consolidator
```

## Usage

### Basic Usage

```bash
# Dry run (shows what would change)
ui-consolidate src/

# Apply changes
ui-consolidate --fix src/

# Process specific file
ui-consolidate --fix src/components/MyComponent.tsx
```

### Options

- `--fix` - Apply changes (default is dry-run)
- `--sort` - Sort consolidated imports alphabetically
- `--force, -f` - Run even with uncommitted git changes
- `--verbose` - Show detailed logs
- `--quiet` - Show minimal logs
- `--check` - Exit non-zero if files need consolidation (useful for CI)
- `--except <patterns...>` - Exclude files/folders
- `--include <patterns...>` - Include specific files
- `--barrel <paths...>` - Add barrel file paths
- `--no-cache` - Disable incremental cache
- `--report` - Generate JSON report
- `--config` - Interactive configuration
- `--history` - Show run history
- `--clear-history` - Clear stored history

### Examples

```bash
# Dry run with sorting
ui-consolidate --sort src/

# Fix with verbose output
ui-consolidate --fix --verbose components/

# Check mode for CI
ui-consolidate --check src/

# Exclude node_modules and test files
ui-consolidate --fix --except node_modules test src/

# Include only specific directories
ui-consolidate --fix --include components pages src/
```

## What It Does

This tool consolidates multiple UI component imports from specific paths into a single import from a barrel file.

**Before:**
```tsx
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';
```

**After:**
```tsx
import { Button, Input, Card } from '@/shared/components/ui';
```

## Configuration

Run `ui-consolidate --config` for interactive configuration, or manually edit `~/.config/import-consolidator/config.json`:

```json
{
  "barrelPaths": ["src/shared/components/ui/index.ts"],
  "extensions": [".tsx"],
  "defaultExcludes": ["node_modules", ".git", "dist", "build"],
  "sortImports": false,
  "cacheEnabled": true,
  "uiComponents": []
}
```

## Features

- **Smart Detection** - Only consolidates imports that are actually exported from barrel files
- **Backup System** - Automatically creates backups before making changes
- **Incremental Cache** - Skips unchanged files for better performance
- **Git Integration** - Checks for uncommitted changes before running
- **History Tracking** - Keeps track of previous runs
- **Flexible Filtering** - Include/exclude patterns for fine-grained control
- **CI/CD Ready** - Check mode for continuous integration

## API Usage

```typescript
import { UIImportConsolidator, Config } from 'ui-import-consolidator';

const config = new Config();
await config.initialize();

const consolidator = new UIImportConsolidator(config, verbose, quiet);
await consolidator.initialize();

const results = await consolidator.processFiles(
  ['src/'],
  false, // dryRun
  true,  // sortImports
  undefined, // includePatterns
  undefined, // excludePatterns
  true   // useCache
);
```

## Requirements

- Node.js >= 16.0.0
- TypeScript projects with JSX/TSX files

## License

MIT

## Author

Remco Stoeten (@remcostoeten on GitHub)
