


import { Config } from '../src/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createTestConfig, cleanup } from './utils';

describe('Config', () => {
  let tempDir: string;
  let config: Config;

  beforeEach(async () => {
    const { config: testConfig, tempDir: testTempDir } = await createTestConfig();
    config = testConfig;
    tempDir = testTempDir;
  });

  afterEach(async () => {
    await cleanup(tempDir);
  });

  describe('initialization', () => {
    test('should load default config when file does not exist', async () => {
      await config.initialize();

      expect(config.get('barrelPaths')).toEqual(['src/shared/components/ui/index.ts']);
      expect(config.get('extensions')).toEqual(['.tsx']);
      expect(config.get('sortImports')).toBe(false);
      expect(config.get('cacheEnabled')).toBe(true);
    });
  });

  describe('configuration management', () => {
    beforeEach(async () => {
      await config.initialize();
    });


    test('should set and persist config values', async () => {
      await config.set('sortImports', true);
      await config.set('extensions', ['.tsx', '.ts']);

      expect(config.get('sortImports')).toBe(true);
      expect(config.get('extensions')).toEqual(['.tsx', '.ts']);

      const content = await fs.readFile(config.configFile, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.sortImports).toBe(true);
      expect(parsed.extensions).toEqual(['.tsx', '.ts']);
    });

    test('should load and merge config from file', async () => {
      const partialConfig = {
        sortImports: true,
        barrelPaths: ['custom/path/index.ts']
      };

      await fs.writeFile(config.configFile, JSON.stringify(partialConfig, null, 2));

      const newConfig = new (class extends Config {
        constructor() {
          super();
          this.configDir = join(tempDir, '.config', 'import-consolidator');
          this.configFile = join(this.configDir, 'config.json');
          this.cacheFile = join(this.configDir, 'cache.json');
          this.historyFile = join(this.configDir, 'history.json');
          this.backupsDir = join(this.configDir, 'backups');
          this.reportsDir = join(this.configDir, 'reports');
        }
      })();

      await newConfig.initialize();

      expect(newConfig.get('sortImports')).toBe(true);
      expect(newConfig.get('barrelPaths')).toEqual(['custom/path/index.ts']);
      expect(newConfig.get('extensions')).toEqual(['.tsx']); // Default value
      expect(newConfig.get('cacheEnabled')).toBe(true); // Default value
    });
  });
});

