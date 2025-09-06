import { promises as fs } from 'fs';
const { parse } = require('@typescript-eslint/parser');
import { TSESTree } from '@typescript-eslint/types';
import { TImportInfo } from './types';
export class TSXParser {
  constructor(private uiComponents: Set<string>) { }
  async parseBarrelFile(barrelPath: string): Promise<Set<string>> {
    const components = new Set<string>();
    try {
      const content = await fs.readFile(barrelPath, 'utf-8');
      const ast = parse(content, {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      });
      this.walkAST(ast, (node) => {
        if (node.type === 'ExportNamedDeclaration' && node.specifiers) {
          for (const specifier of node.specifiers) {
            if (specifier.type === 'ExportSpecifier' && specifier.exported.type === 'Identifier') {
              components.add(specifier.exported.name);
            }
          }
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not parse barrel file ${barrelPath}: ${error}`);
    }
    return components;
  }
  async parseTSXFile(filePath: string): Promise<[TImportInfo[], string]> {
    const content = await fs.readFile(filePath, 'utf-8');
    try {
      const ast = parse(content, {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      });
      const imports: TImportInfo[] = [];
      this.walkAST(ast, (node) => {
        if (node.type === 'ImportDeclaration' &&
          node.source.type === 'Literal' &&
          typeof node.source.value === 'string') {
          const moduleName = node.source.value;
          if (moduleName.startsWith('@/shared/components/ui/') && moduleName !== '@/shared/components/ui') {
            const names = new Set<string>();
            const lineNumbers: number[] = [];
            if (node.specifiers) {
              for (const specifier of node.specifiers) {
                if (specifier.type === 'ImportSpecifier' &&
                  specifier.imported.type === 'Identifier' &&
                  this.uiComponents.has(specifier.imported.name)) {
                  names.add(specifier.local.name);
                  if (node.loc) {
                    lineNumbers.push(node.loc.start.line);
                  }
                } else if (specifier.type === 'ImportDefaultSpecifier' &&
                  this.uiComponents.has(specifier.local.name)) {
                  names.add(specifier.local.name);
                  if (node.loc) {
                    lineNumbers.push(node.loc.start.line);
                  }
                }
              }
            }
            if (names.size > 0) {
              imports.push({
                module: moduleName,
                names,
                lineNumbers
              });
            }
          }
        }
      });
      return [imports, content];
    } catch (error) {
      throw new Error(`Could not parse ${filePath} as valid TypeScript: ${error}`);
    }
  }
  private walkAST(node: TSESTree.Node, callback: (node: TSESTree.Node) => void) {
    callback(node);
    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object' && 'type' in item) {
              this.walkAST(item as TSESTree.Node, callback);
            }
          }
        } else if ('type' in value) {
          this.walkAST(value as TSESTree.Node, callback);
        }
      }
    }
  }
}
