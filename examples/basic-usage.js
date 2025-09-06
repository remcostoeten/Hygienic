const { UIImportConsolidator, Config } = require('../dist/index.js');

async function consolidateImports() {
  const config = new Config();
  await config.initialize();

  const consolidator = new UIImportConsolidator(config);
  await consolidator.initialize();

  // Process files (dry run)
  const results = await consolidator.processFiles(['src/'], true, true);
  
  console.log(`Found ${results.length} files`);
  console.log(`${results.filter(r => r.changed).length} files would be changed`);
  
  return results;
}

consolidateImports().catch(console.error);
