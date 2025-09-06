# Hygienic

A code hygiene tool that consolidates and normalizes imports across your codebase. Built for TypeScript/React projects with barrel file patterns.

## Installation

```bash
# Install globally with Bun
bun add -g @remcostoeten/hygienic

# Or run directly with bunx
bunx @remcostoeten/hygienic

# Or as a dev dependency
bun add -D @remcostoeten/hygienic
```

## Usage

### Basic Usage

```bash
# Dry run (shows what would change)
hygienic src/

# Apply changes
hygienic --fix src/

# Process specific file
hygienic --fix src/components/MyComponent.tsx
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
hygienic --sort src/

# Fix with verbose output
hygienic --fix --verbose components/

# Check mode for CI
hygienic --check src/

# Exclude node_modules and test files
hygienic --fix --except node_modules test src/

# Include only specific directories
hygienic --fix --include components pages src/
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

Run `hygienic --config` for interactive configuration, or manually edit `~/.config/import-consolidator/config.json`:

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
import { UIImportConsolidator, Config } from '@remcostoeten/hygienic';

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

## Migration from ui-import-consolidator

This package was previously named `ui-import-consolidator`. If you're migrating:

**Breaking Changes:**
- Package name: `ui-import-consolidator` → `@remcostoeten/hygienic`
- CLI command: `ui-consolidate` → `hygienic`
- Programmatic imports: `from 'ui-import-consolidator'` → `from '@remcostoeten/hygienic'`

**Migration steps:**
1. Uninstall the old package: `bun remove ui-import-consolidator`
2. Install the new package: `bun add -g @remcostoeten/hygienic`
3. Update any scripts or workflows to use `hygienic` instead of `ui-consolidate`
4. Update any programmatic imports in your code

## Requirements

- Node.js >= 16.0.0
- TypeScript projects with JSX/TSX files

## License

BSD 3-Clause License with README Attribution Requirement

This software is free to use and modify, but requires attribution in your project's README or primary documentation when used. See the [LICENSE](LICENSE) file for full details.

### Attribution Requirements

If you use or modify this software, you must include attribution in your README:

```markdown
This project uses or is based on [Hygienic](https://github.com/remcostoeten/hygienic) by Remco Stoeten (@remcostoeten)
```

**Required elements:**
- Reference to "Hygienic" as the original tool
- Link to the original repository or npm package
- Credit to "Remco Stoeten (@remcostoeten)"

## Author

Remco Stoeten (@remcostoeten on GitHub)
