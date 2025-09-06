export type TImportInfo = {
  module: string;
  names: Set<string>;
  lineNumbers: number[];
};

export type TConsolidationResult = {
  filePath: string;
  originalImports: string[];
  consolidatedImport: string;
  otherImports: string[];
  changed: boolean;
  backupPath?: string;
};

export type TRunHistory = {
  timestamp: string;
  paths: string[];
  options: Record<string, any>;
  status: string;
  filesChanged: number;
  filesProcessed: number;
};

export type TConfig = {
  barrelPaths: string[];
  extensions: string[];
  defaultExcludes: string[];
  sortImports: boolean;
  cacheEnabled: boolean;
  uiComponents: string[];
};

export type TCacheData = {
  [filePath: string]: {
    hash: string;
    changed: boolean;
    timestamp: string;
  };
};
