import { promises as fs } from 'fs'
import { join } from 'path'

import { Cache } from '../src/cache'
import { Config } from '../src/config'
import { cleanup, createTestConfig } from './utils'

describe('Cache', () => {
	let tempDir: string
	let cache: Cache
	let config: Config

	beforeEach(async () => {
		const { config: testConfig, tempDir: testTempDir } = await createTestConfig()
		config = testConfig
		tempDir = testTempDir
		cache = new Cache(config)
	})

	afterEach(async () => {
		await cleanup(tempDir)
	})

	describe('cache initialization', () => {
		test('should initialize empty cache when file does not exist', async () => {
			await cache.load()
			const isCached = await cache.isFileCached('/some/file.tsx')
			expect(isCached).toBe(false)
		})

		test('should load existing cache file', async () => {
			const cacheData = {
				'/path/to/file.tsx': {
					hash: 'abc123',
					changed: true,
					timestamp: new Date().toISOString()
				}
			}

			await fs.writeFile(config.cacheFile, JSON.stringify(cacheData))
			await cache.load()

			const isCached = await cache.isFileCached('/path/to/file.tsx')
			expect(isCached).toBe(false)
		})

		test('should handle corrupted cache file gracefully', async () => {
			await fs.writeFile(config.cacheFile, 'invalid json {{{')
			await cache.load()

			const isCached = await cache.isFileCached('/some/file.tsx')
			expect(isCached).toBe(false)
		})
	})

	describe('cache operations', () => {
		beforeEach(async () => {
			await cache.load()
		})

		test('should cache files with results', async () => {
			const filePath = join(tempDir, 'test.tsx')
			const content = 'import { Button } from "@/shared/components/ui/button";'

			await fs.writeFile(filePath, content)

			const result = {
				filePath,
				originalImports: [],
				consolidatedImport: '',
				otherImports: [],
				changed: false
			}

			await cache.cacheFile(filePath, result)
			const isCached = await cache.isFileCached(filePath)
			expect(isCached).toBe(true)
		})

		test('should detect file changes', async () => {
			const filePath = join(tempDir, 'test.tsx')
			const content = 'initial content'

			await fs.writeFile(filePath, content)

			const result = {
				filePath,
				originalImports: [],
				consolidatedImport: '',
				otherImports: [],
				changed: false
			}

			await cache.cacheFile(filePath, result)
			let isCached = await cache.isFileCached(filePath)
			expect(isCached).toBe(true)

			await fs.writeFile(filePath, 'modified content')
			isCached = await cache.isFileCached(filePath)
			expect(isCached).toBe(false)
		})
	})
})
