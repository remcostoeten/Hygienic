# Hygienic

**Hygienic** is a versatile TypeScript tool that:
- Cleans up unused imports, types, methods, and variables  
- Organizes barrel file imports  
- Enforces a consistent structure  

👉 Making your colleagues hate you less during code reviews.

---

## Install

```bash
bun add -g @remcostoeten/hygienic
```

Or run without installing:

```bash
bunx @remcostoeten/hygienic src/
```
<small><i>pnpm also works, or npm/yarn if you're a maniac</i></small>
---

## Usage

```bash
hygienic src/          # Preview changes
hygienic src/ --fix    # Apply changes
```

### Options
- `--check` - Exit with error if changes needed (CI mode)  
- `--verbose` - Show detailed output  
- `--except <patterns>` - Skip files/folders  
- `--include <patterns>` - Only process these patterns  
- `--config` - Interactive setup  

### Examples

```bash
hygienic src/ --fix --sort
hygienic components/ --check   # CI mode
hygienic src/ --except test stories
```

---

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

---

## ⚙️ Config

Run `hygienic --config` or edit `~/.config/import-consolidator/config.json`:

```json
{
  "barrelPaths": ["src/shared/components/ui/index.ts"],
  "extensions": [".tsx"],
  "sortImports": false
}
```

---

## Features

- Consolidates only when a barrel file exists  
- Creates backups before making changes  
- Caches results for speed  
- Git status checking  
- CI/CD support with `--check`  

---

## API

For build tools and custom integrations:

```ts
import { UIImportConsolidator, Config } from '@remcostoeten/hygienic';

const config = new Config();
await config.initialize();

const consolidator = new UIImportConsolidator(config);
await consolidator.initialize();

const results = await consolidator.processFiles(['src/'], false, true);
```

See `examples/` for more.

---

xxx,
Remco Stoeten
