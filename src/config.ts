import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { TConfig } from './types';

export class Config {
  public configDir: string;
  public configFile: string;
  public cacheFile: string;
  public historyFile: string;
  public backupsDir: string;
  public reportsDir: string;
  public data: TConfig;

  private defaultConfig: TConfig = {
    barrelPaths: ['src/shared/components/ui/index.ts'],
    extensions: ['.tsx'],
    defaultExcludes: ['node_modules', '.git', 'dist', 'build'],
    sortImports: false,
    cacheEnabled: true,
    uiComponents: []
  };

  constructor() {
    this.configDir = join(homedir(), '.config', 'import-consolidator');
    this.configFile = join(this.configDir, 'config.json');
    this.cacheFile = join(this.configDir, 'cache.json');
    this.historyFile = join(this.configDir, 'history.json');
    this.backupsDir = join(this.configDir, 'backups');
    this.reportsDir = join(this.configDir, 'reports');
    this.data = { ...this.defaultConfig };
  }

  async initialize() {
    await this.ensureDirectories();
    await this.loadConfig();
  }

  private async ensureDirectories() {
    await fs.mkdir(this.configDir, { recursive: true });
    await fs.mkdir(this.backupsDir, { recursive: true });
    await fs.mkdir(this.reportsDir, { recursive: true });
  }

  private async loadConfig() {
    try {
      const content = await fs.readFile(this.configFile, 'utf-8');
      const loaded = JSON.parse(content);
      this.data = { ...this.defaultConfig, ...loaded };
    } catch {
      this.data = { ...this.defaultConfig };
      await this.saveConfig();
    }
  }

  async saveConfig() {
    await fs.writeFile(this.configFile, JSON.stringify(this.data, null, 2));
  }

  get<K extends keyof TConfig>(key: K): TConfig[K] {
    return this.data[key];
  }

  async set<K extends keyof TConfig>(key: K, value: TConfig[K]) {
    this.data[key] = value;
    await this.saveConfig();
  }
}
