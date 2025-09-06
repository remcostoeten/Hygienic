import { promises as fs } from 'fs'
import { join } from 'path'

import { Config } from '../src/config'
import { UIImportConsolidator } from '../src/consolidator'
import {
	cleanup,
	createBarrelFileContent,
	createMockTSXContent,
	createTestConfig,
	createTestFile
} from './utils'

describe('UIImportConsolidator', () => {
	let tempDir: string
	let config: Config
	let consolidator: UIImportConsolidator

	beforeEach(async () => {
		const { config: testConfig, tempDir: testTempDir } = await createTestConfig()
		config = testConfig
		tempDir = testTempDir
		consolidator = new UIImportConsolidator(config, false, true)
	})

	afterEach(async () => {
		await cleanup(tempDir)
	})

	describe('initialization', () => {
		test('should load UI components from barrel files', async () => {
			const barrelContent = createBarrelFileContent(['Button', 'Input', 'Card'])
			const barrelPath = join(tempDir, 'src', 'ui', 'index.ts')
			await createTestFile(tempDir, 'src/ui/index.ts', barrelContent)

			await config.set('barrelPaths', [barrelPath])

			const newConsolidator = new UIImportConsolidator(config, false, true)
			await newConsolidator.initialize()

			const result = await newConsolidator.processFiles([tempDir])
			expect(result).toBeDefined()
		})

		test('should handle missing barrel files gracefully', async () => {
			await config.set('barrelPaths', ['/nonexistent/path.ts'])

			const newConsolidator = new UIImportConsolidator(config, false, true)
			await newConsolidator.initialize()

			const result = await newConsolidator.processFiles([tempDir])
			expect(result).toEqual([])
		})
	})

	describe('file operations', () => {
		beforeEach(async () => {
			await config.set('uiComponents', ['Button', 'Input'])
			await consolidator.initialize()
		})

		test('should create backups when applying changes', async () => {
			const imports = ["import { Button } from '@/shared/components/ui/button';"]
			const tsxContent = createMockTSXContent(imports)
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)

			const results = await consolidator.processFiles([tsxFile], false)

			expect(results[0].backupPath).toBeDefined()
			expect(results[0].backupPath).toBeTruthy()

			const backupExists = await fs
				.access(results[0].backupPath!)
				.then(() => true)
				.catch(() => false)
			expect(backupExists).toBe(true)
		})

		test('should modify file content when applying changes', async () => {
			const imports = [
				"import { Button } from '@/shared/components/ui/button';",
				"import { Input } from '@/shared/components/ui/input';"
			]
			const tsxContent = createMockTSXContent(imports)
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)
			const originalContent = await fs.readFile(tsxFile, 'utf-8')

			await consolidator.processFiles([tsxFile], false)

			const modifiedContent = await fs.readFile(tsxFile, 'utf-8')
			expect(modifiedContent).not.toBe(originalContent)
			expect(modifiedContent).toContain(
				"import { Button, Input } from '@/shared/components/ui';"
			)
			expect(modifiedContent).not.toContain("from '@/shared/components/ui/button'")
			expect(modifiedContent).not.toContain("from '@/shared/components/ui/input'")
		})

		test('should not modify files in dry run mode', async () => {
			const imports = ["import { Button } from '@/shared/components/ui/button';"]
			const tsxContent = createMockTSXContent(imports)
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)
			const originalContent = await fs.readFile(tsxFile, 'utf-8')

			await consolidator.processFiles([tsxFile], true)

			const contentAfter = await fs.readFile(tsxFile, 'utf-8')
			expect(contentAfter).toBe(originalContent)
		})
	})

	describe('caching', () => {
		beforeEach(async () => {
			await config.set('uiComponents', ['Button'])
			await consolidator.initialize()
		})

		test('should skip cached files', async () => {
			const imports = ["import { Button } from '@/shared/components/ui/button';"]
			const tsxContent = createMockTSXContent(imports)
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)

			await consolidator.processFiles([tsxFile], true, false, undefined, undefined, true)

			const results = await consolidator.processFiles(
				[tsxFile],
				true,
				false,
				undefined,
				undefined,
				true
			)
			expect(results).toEqual([])
		})

		test('should process files when cache is disabled', async () => {
			const imports = ["import { Button } from '@/shared/components/ui/button';"]
			const tsxContent = createMockTSXContent(imports)
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)

			await consolidator.processFiles([tsxFile], true, false, undefined, undefined, false)

			const results = await consolidator.processFiles(
				[tsxFile],
				true,
				false,
				undefined,
				undefined,
				false
			)
			expect(results.length).toBe(1)
		})
	})

	describe('error handling', () => {
		test('should handle non-existent paths gracefully', async () => {
			const results = await consolidator.processFiles(['/nonexistent/path'], true)
			expect(results).toEqual([])
		})

		test('should handle invalid TSX files', async () => {
			const invalidTSX = 'invalid typescript syntax {{{'
			const tsxFile = await createTestFile(tempDir, 'invalid.tsx', invalidTSX)

			const results = await consolidator.processFiles([tsxFile], true)
			expect(results).toEqual([])
		})

		test('should continue processing other files when one fails', async () => {
			const imports = ["import { Button } from '@/shared/components/ui/button';"]
			const validTSX = createMockTSXContent(imports)
			const invalidTSX = 'invalid syntax {{{'

			await config.set('uiComponents', ['Button'])
			await consolidator.initialize()

			await createTestFile(tempDir, 'valid.tsx', validTSX)
			await createTestFile(tempDir, 'invalid.tsx', invalidTSX)

			const results = await consolidator.processFiles([tempDir], true)
			expect(results.length).toBe(1)
			expect(results[0].filePath).toContain('valid.tsx')
		})
	})
})
