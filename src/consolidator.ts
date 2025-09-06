import { exec } from 'child_process'
import { promises as fs } from 'fs'
import { glob } from 'glob'
import { basename, join, relative } from 'path'
import { promisify } from 'util'

import { Cache } from './cache'
import { Colors } from './colors'
import { Config } from './config'
import { History } from './history'
import { TSXParser } from './parser'
import { TConsolidationResult } from './types'
import { noop } from './utils/noop'

const execAsync = promisify(exec)

export class UIImportConsolidator {
	private cache: Cache
	private history: History
	private parser: TSXParser
	private uiComponents = new Set<string>()

	constructor(
		private config: Config,
		private verbose: boolean = false,
		private quiet: boolean = false
	) {
		this.cache = new Cache(config)
		this.history = new History(config)
		this.parser = new TSXParser(this.uiComponents)
	}

	async initialize() {
		await this.cache.load()
		await this.history.load()
		await this.loadUIComponents()
	}

	private async loadUIComponents() {
		for (const barrelPath of this.config.get('barrelPaths')) {
			try {
				await fs.access(barrelPath)
				const components = await this.parser.parseBarrelFile(barrelPath)
				for (const component of components) {
					this.uiComponents.add(component)
				}
			} catch {
				noop()
			}
		}

		for (const component of this.config.get('uiComponents')) {
			this.uiComponents.add(component)
		}
	}

	private log(message: string, colorFn = Colors.white) {
		if (!this.quiet) {
			console.log(colorFn(message))
		}
	}

	private verboseLog(message: string, colorFn = Colors.blue) {
		if (this.verbose && !this.quiet) {
			console.log(colorFn(`[VERBOSE] ${message}`))
		}
	}

	async checkGitStatus(force: boolean = false): Promise<boolean> {
		try {
			const { stdout } = await execAsync('git status --porcelain', { cwd: process.cwd() })
			if (stdout.trim() && !force) {
				this.log(
					'Error: Git has uncommitted changes. Use --force to proceed anyway.',
					Colors.red
				)
				return false
			}
			return true
		} catch {
			this.verboseLog('Git not found, skipping git status check')
			return true
		}
	}

	private async createBackup(filePath: string): Promise<string> {
		const projectName = basename(process.cwd())
		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, '-')
			.split('T')
			.join('_')
			.split('.')[0]
		const backupDir = join(this.config.backupsDir, projectName, timestamp, 'files')

		await fs.mkdir(backupDir, { recursive: true })

		const relativePath = relative(process.cwd(), filePath)
		const backupFile = join(backupDir, relativePath.replace(/\//g, '_'))

		await fs.copyFile(filePath, backupFile)
		return backupFile
	}

	async cleanupOldBackups() {
		const cutoffDate = new Date()
		cutoffDate.setDate(cutoffDate.getDate() - 7)

		try {
			const projectDirs = await fs.readdir(this.config.backupsDir)

			for (const projectDir of projectDirs) {
				const projectPath = join(this.config.backupsDir, projectDir)
				const stat = await fs.stat(projectPath)

				if (stat.isDirectory()) {
					const timestampDirs = await fs.readdir(projectPath)

					for (const timestampDir of timestampDirs) {
						try {
							const dirDate = new Date(
								timestampDir.replace(/_/g, ':').replace('-', 'T') + '.000Z'
							)
							if (dirDate < cutoffDate) {
								const fullPath = join(projectPath, timestampDir)
								await fs.rm(fullPath, { recursive: true, force: true })
								this.verboseLog(`Cleaned up old backup: ${fullPath}`)
							}
						} catch {
							noop()
						}
					}
				}
			}
		} catch {
			noop()
		}
	}

	private async consolidateImports(
		filePath: string,
		dryRun: boolean = true,
		sortImports: boolean = false
	): Promise<TConsolidationResult> {
		try {
			const [uiImports, content] = await this.parser.parseTSXFile(filePath)

			if (uiImports.length === 0) {
				return {
					filePath,
					originalImports: [],
					consolidatedImport: '',
					otherImports: [],
					changed: false
				}
			}

			const allUINames = new Set<string>()
			const originalImportLines = new Set<number>()

			for (const importInfo of uiImports) {
				for (const name of importInfo.names) {
					allUINames.add(name)
				}
				for (const lineNumber of importInfo.lineNumbers) {
					originalImportLines.add(lineNumber)
				}
			}

			const sortedNames = sortImports ? Array.from(allUINames).sort() : Array.from(allUINames)

			const consolidatedImport = `import { ${sortedNames.join(', ')} } from '@/shared/components/ui';`

			const lines = content.split('\n')
			const newLines: string[] = []
			let consolidatedAdded = false

			for (let i = 0; i < lines.length; i++) {
				const lineNumber = i + 1
				if (originalImportLines.has(lineNumber)) {
					if (!consolidatedAdded) {
						newLines.push(consolidatedImport)
						consolidatedAdded = true
					}
				} else {
					newLines.push(lines[i])
				}
			}

			const newContent = newLines.join('\n')

			let backupPath: string | undefined
			if (!dryRun && newContent !== content) {
				backupPath = await this.createBackup(filePath)
				await fs.writeFile(filePath, newContent, 'utf-8')
			}

			const originalImports = uiImports.map(
				imp => `import { ${Array.from(imp.names).sort().join(', ')} } from '${imp.module}';`
			)

			return {
				filePath,
				originalImports,
				consolidatedImport,
				otherImports: [],
				changed: newContent !== content,
				backupPath
			}
		} catch (error) {
			throw new Error(`Error processing ${filePath}: ${error}`)
		}
	}

	private async findTSXFiles(
		path: string,
		includePatterns?: string[],
		excludePatterns?: string[]
	): Promise<string[]> {
		const extensions = this.config.get('extensions')
		const patterns = extensions.map(ext => `${path}/**/*${ext}`)

		let files: string[] = []
		for (const pattern of patterns) {
			const found = await glob(pattern)
			files = files.concat(found)
		}

		const excludes = excludePatterns || this.config.get('defaultExcludes')

		let filteredFiles = files.filter(file => {
			return !excludes.some(pattern => file.includes(pattern))
		})

		if (includePatterns) {
			filteredFiles = filteredFiles.filter(file => {
				return includePatterns.some(pattern => file.includes(pattern))
			})
		}

		return filteredFiles
	}

	async processFiles(
		paths: string[],
		dryRun: boolean = true,
		sortImports: boolean = false,
		includePatterns?: string[],
		excludePatterns?: string[],
		useCache: boolean = true
	): Promise<TConsolidationResult[]> {
		const results: TConsolidationResult[] = []

		let allFiles: string[] = []
		for (const path of paths) {
			try {
				const stat = await fs.stat(path)
				if (stat.isFile()) {
					allFiles.push(path)
				} else if (stat.isDirectory()) {
					const foundFiles = await this.findTSXFiles(
						path,
						includePatterns,
						excludePatterns
					)
					allFiles = allFiles.concat(foundFiles)
				}
			} catch {
				this.verboseLog(`Path not found: ${path}`)
			}
		}

		this.log(`Found ${allFiles.length} files to process`)

		for (const filePath of allFiles) {
			this.verboseLog(`Processing: ${filePath}`)

			if (useCache && (await this.cache.isFileCached(filePath))) {
				this.log(`[SKIP] ${filePath} (cached, unchanged)`, Colors.yellow)
				continue
			}

			try {
				const result = await this.consolidateImports(filePath, dryRun, sortImports)

				if (result.changed) {
					if (dryRun) {
						this.log(`[CHANGE] Would consolidate imports in ${filePath}`, Colors.green)
					} else {
						this.log(
							`[CHANGE] Consolidated imports in ${filePath} → backup created`,
							Colors.green
						)
						if (result.backupPath) {
							this.log(`[BACKUP] Saved to ${result.backupPath}`, Colors.blue)
						}
					}
				} else {
					this.log(`[SKIP] No UI imports found in ${filePath}`, Colors.yellow)
				}

				if (this.verbose) {
					if (result.originalImports.length > 0) {
						this.verboseLog('Original imports:')
						for (const imp of result.originalImports) {
							this.verboseLog(`  - ${imp}`)
						}
						this.verboseLog(`Consolidated to: ${result.consolidatedImport}`)
					}
				}

				results.push(result)
				await this.cache.cacheFile(filePath, result)
			} catch (error) {
				this.log(`[ERROR] Failed to process ${filePath}: ${error}`, Colors.red)
			}
		}

		await this.cache.save()
		return results
	}
}
