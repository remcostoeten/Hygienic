#!/usr/bin/env node

// ci-check.js - Use in CI to fail if imports need consolidation
const { UIImportConsolidator, Config } = require('@remcostoeten/hygienic');

async function checkImports() {
  try {
    const config = new Config();
    await config.initialize();

    const consolidator = new UIImportConsolidator(config, false, true); // quiet mode
    await consolidator.initialize();

    // Dry run to check what would change
    const results = await consolidator.processFiles(['src/'], true, true);
    const needsChanges = results.filter(r => r.changed);

    if (needsChanges.length > 0) {
      console.log(`❌ ${needsChanges.length} files have imports that need consolidation:`);
      needsChanges.forEach(result => {
        console.log(`  - ${result.filePath}`);
      });
      console.log('\\nRun: hygienic src/ --fix');
      process.exit(1);
    } else {
      console.log('✅ All imports are properly consolidated');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error checking imports:', error.message);
    process.exit(1);
  }
}

checkImports();
