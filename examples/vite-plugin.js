// vite-plugin-hygienic.js
import { UIImportConsolidator, Config } from '@remcostoeten/hygienic';

export function hygienicPlugin(options = {}) {
  let config;
  let consolidator;

  return {
    name: 'hygienic',
    
    async buildStart() {
      if (!options.enabled) return;
      
      config = new Config();
      await config.initialize();
      
      consolidator = new UIImportConsolidator(config, options.verbose, options.quiet);
      await consolidator.initialize();
      
      const results = await consolidator.processFiles(
        options.paths || ['src/'],
        false, // Apply changes during build
        options.sortImports || true
      );
      
      const changed = results.filter(r => r.changed);
      if (changed.length > 0) {
        console.log(`Hygienic: Consolidated imports in ${changed.length} files`);
      }
    }
  };
}

// Usage in vite.config.js:
// import { hygienicPlugin } from './vite-plugin-hygienic.js';
// 
// export default {
//   plugins: [
//     hygienicPlugin({
//       enabled: true,
//       paths: ['src/'],
//       sortImports: true,
//       verbose: false
//     })
//   ]
// };
