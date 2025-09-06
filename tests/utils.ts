import { randomBytes } from 'crypto'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { Config } from '../src/config'

export async function createTestConfig() {
	const tempDir = await createTempDir()
	const config = new (class extends Config {
		constructor() {
			super()
			this.configDir = join(tempDir, '.config', 'import-consolidator')
			this.configFile = join(this.configDir, 'config.json')
			this.cacheFile = join(this.configDir, 'cache.json')
			this.historyFile = join(this.configDir, 'history.json')
			this.backupsDir = join(this.configDir, 'backups')
			this.reportsDir = join(this.configDir, 'reports')
		}
	})()
	await config.initialize()
	return { config, tempDir }
}

export function createTempDir(): Promise<string> {
	const tempDirName = `ui-consolidator-test-${randomBytes(8).toString('hex')}`
	const tempPath = join(tmpdir(), tempDirName)
	return fs.mkdir(tempPath, { recursive: true }).then(() => tempPath)
}

export async function cleanup(path: string) {
	try {
		await fs.rm(path, { recursive: true, force: true })
	} catch {}
}

export async function createTestFile(
	dir: string,
	filename: string,
	content: string
): Promise<string> {
	const filePath = join(dir, filename)
	const dirPath = join(filePath, '..')
	await fs.mkdir(dirPath, { recursive: true })
	await fs.writeFile(filePath, content, 'utf-8')
	return filePath
}

export function createMockTSXContent(imports: string[], componentUsage: string[] = []): string {
	const importsSection = imports.join('\n')
	const componentsUsed = componentUsage.length > 0 ? componentUsage : ['Button']
	const componentElements = componentsUsed.map(comp => `<${comp} />`).join('\n      ')

	return `${importsSection}

export function TestComponent() {
  return (
    <div>
      ${componentElements}
    </div>
  );
}`
}

export function createBarrelFileContent(exports: string[]): string {
	return exports.map(exp => `export { ${exp} } from './${exp.toLowerCase()}';`).join('\n')
}
