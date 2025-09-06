import { TSXParser } from '../src/parser'
import {
	cleanup,
	createBarrelFileContent,
	createMockTSXContent,
	createTempDir,
	createTestFile
} from './utils'

describe('TSXParser', () => {
	let tempDir: string
	let parser: TSXParser

	beforeEach(async () => {
		tempDir = await createTempDir()
		const uiComponents = new Set(['Button', 'Input', 'Card', 'Dialog', 'Toast', 'TextInput'])
		parser = new TSXParser(uiComponents)
	})

	afterEach(async () => {
		await cleanup(tempDir)
	})

	describe('barrel file parsing', () => {
		test('should parse simple barrel file exports', async () => {
			const barrelContent = createBarrelFileContent(['Button', 'Input', 'Card'])
			const barrelFile = await createTestFile(tempDir, 'index.ts', barrelContent)

			const components = await parser.parseBarrelFile(barrelFile)

			expect(components.has('Button')).toBe(true)
			expect(components.has('Input')).toBe(true)
			expect(components.has('Card')).toBe(true)
			expect(components.size).toBe(3)
		})

		test('should parse barrel file with named imports', async () => {
			const barrelContent = `
export { Button } from './button';
export { Input as TextInput } from './input';
export { default as Card } from './card';
      `.trim()

			const barrelFile = await createTestFile(tempDir, 'index.ts', barrelContent)
			const components = await parser.parseBarrelFile(barrelFile)

			expect(components.has('Button')).toBe(true)
			expect(components.has('TextInput')).toBe(true)
			expect(components.has('Card')).toBe(true)
		})

		test('should handle barrel file parsing errors gracefully', async () => {
			const invalidContent = 'invalid typescript syntax {{{'
			const barrelFile = await createTestFile(tempDir, 'invalid.ts', invalidContent)

			const components = await parser.parseBarrelFile(barrelFile)
			expect(components.size).toBe(0)
		})
	})

	describe('TSX file parsing', () => {
		test('should parse simple UI imports', async () => {
			const imports = [
				"import { Button } from '@/shared/components/ui/button';",
				"import { Input } from '@/shared/components/ui/input';"
			]
			const tsxContent = createMockTSXContent(imports, ['Button', 'Input'])
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)

			const [importInfos, content] = await parser.parseTSXFile(tsxFile)

			expect(importInfos).toHaveLength(2)
			expect(importInfos[0].module).toBe('@/shared/components/ui/button')
			expect(importInfos[0].names.has('Button')).toBe(true)
			expect(importInfos[1].module).toBe('@/shared/components/ui/input')
			expect(importInfos[1].names.has('Input')).toBe(true)
			expect(content).toBe(tsxContent)
		})

		test('should ignore imports from barrel file itself', async () => {
			const imports = [
				"import { Button, Input } from '@/shared/components/ui';",
				"import { Card } from '@/shared/components/ui/card';"
			]
			const tsxContent = createMockTSXContent(imports)
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)

			const [importInfos] = await parser.parseTSXFile(tsxFile)

			expect(importInfos).toHaveLength(1)
			expect(importInfos[0].module).toBe('@/shared/components/ui/card')
		})

		test('should ignore non-UI imports', async () => {
			const imports = [
				"import React from 'react';",
				"import { useState } from 'react';",
				"import { Button } from '@/shared/components/ui/button';",
				"import { api } from '@/lib/api';"
			]
			const tsxContent = createMockTSXContent(imports)
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)

			const [importInfos] = await parser.parseTSXFile(tsxFile)

			expect(importInfos).toHaveLength(1)
			expect(importInfos[0].module).toBe('@/shared/components/ui/button')
		})

		test('should only include known UI components', async () => {
			const imports = [
				"import { Button, UnknownComponent } from '@/shared/components/ui/button';",
				"import { Input } from '@/shared/components/ui/input';"
			]
			const tsxContent = createMockTSXContent(imports)
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)

			const [importInfos] = await parser.parseTSXFile(tsxFile)

			expect(importInfos).toHaveLength(2)
			expect(importInfos[0].names.has('Button')).toBe(true)
			expect(importInfos[0].names.has('UnknownComponent')).toBe(false)
			expect(importInfos[1].names.has('Input')).toBe(true)
		})

		test('should handle multiple imports from same module', async () => {
			const imports = ["import { Button, Dialog } from '@/shared/components/ui/common';"]
			const tsxContent = createMockTSXContent(imports)
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)

			const [importInfos] = await parser.parseTSXFile(tsxFile)

			expect(importInfos).toHaveLength(1)
			expect(importInfos[0].names.has('Button')).toBe(true)
			expect(importInfos[0].names.has('Dialog')).toBe(true)
			expect(importInfos[0].names.size).toBe(2)
		})

		test('should capture line numbers', async () => {
			const tsxContent = `import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export function TestComponent() {
  return <div><Button /><Input /></div>;
}`
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)

			const [importInfos] = await parser.parseTSXFile(tsxFile)

			expect(importInfos).toHaveLength(2)
			expect(importInfos[0].lineNumbers).toContain(2)
			expect(importInfos[1].lineNumbers).toContain(3)
		})

		test('should handle syntax errors gracefully', async () => {
			const invalidTSX = 'invalid typescript syntax {{{ import { Button'
			const tsxFile = await createTestFile(tempDir, 'invalid.tsx', invalidTSX)

			await expect(parser.parseTSXFile(tsxFile)).rejects.toThrow()
		})

		test('should handle different import styles', async () => {
			const tsxContent = `
import { Button } from '@/shared/components/ui/button';
import { Input as TextInput } from '@/shared/components/ui/input';
import Card from '@/shared/components/ui/card';

export function TestComponent() {
  return <div><Button /><TextInput /><Card /></div>;
}`
			const tsxFile = await createTestFile(tempDir, 'component.tsx', tsxContent)
			const [importInfos] = await parser.parseTSXFile(tsxFile)

			expect(importInfos).toHaveLength(3)
			expect(importInfos[0].names.has('Button')).toBe(true)
			expect(importInfos[1].names.has('TextInput')).toBe(true)
			expect(importInfos[2].names.has('Card')).toBe(true)
		})
	})
})
