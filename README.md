# Hygienic

Hygienic is a versatile TypeScript tool that cleans up unused imports, types, methods, and variables, organizes barrel file imports, and enforces a consistent structure—making your colleagues hate you less while reviewing your code.

Available as a global npm package, a dev dependency, or as an API configurable in your CI.


## install

```bash
bun add -g @remcostoeten/hygienic
```

or run without installing:
```bash
bunx @remcostoeten/hygienic src/
```

## Usage

```bash
hygienic src/          # Preview changes
hygienic src/ --fix    # Apply changes
```

### Options

- `--fix` - Apply changes (default shows preview)
- `--sort` - Sort imports alphabetically
- `--check` - Exit with error if changes needed (CI mode)
- `--verbose` - Show detailed output
- `--except <patterns>` - Skip files/folders
- `--include <patterns>` - Only process these patterns
- `--config` - Interactive setup

### Examples

```bash
hygienic src/ --fix --sort
hygienic components/ --check  # For CI
hygienic src/ --except test stories
```

## What it does

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

## Config

Run `hygienic --config` or edit `~/.config/import-consolidator/config.json`:

```json
{
  "barrelPaths": ["src/shared/components/ui/index.ts"],
  "extensions": [".tsx"],
  "sortImports": false
}
```

## Features

- Only consolidates imports that exist in barrel files
- Creates backups before making changes
- Caches results for faster subsequent runs
- Git status checking
- CI/CD support with `--check` mode

## API

For build tools and custom integrations:

```typescript
import { UIImportConsolidator, Config } from '@remcostoeten/hygienic';

const config = new Config();
await config.initialize();

const consolidator = new UIImportConsolidator(config);
await consolidator.initialize();

const results = await consolidator.processFiles(['src/'], false, true);
```

See `examples/` for more.

## Migration from ui-import-consolidator

- Package: `ui-import-consolidator` → `@remcostoeten/hygienic`
- Command: `ui-consolidate` → `hygienic`
- Imports: `from 'ui-import-consolidator'` → `from '@remcostoeten/hygienic'`

## License

BSD 3-Clause with attribution requirement. See [LICENSE](LICENSE).

If you use this tool, add this line to your README:
```
This project uses Hygienic by Remco Stoeten (@remcostoeten)
```

## Author

Remco Stoeten (@remcostoeten)
