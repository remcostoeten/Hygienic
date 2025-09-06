import { promises as fs } from 'fs'

import { Config } from '../src/config'
import { History } from '../src/history'
import { TRunHistory } from '../src/types'
import { cleanup, createTestConfig } from './utils'

describe('History', () => {
	let tempDir: string
	let config: Config
	let history: History

	beforeEach(async () => {
		const { config: testConfig, tempDir: testTempDir } = await createTestConfig()
		config = testConfig
		tempDir = testTempDir
		history = new History(config)
	})

	afterEach(async () => {
		await cleanup(tempDir)
	})

	describe('history loading and saving', () => {
		test('should load empty history when file does not exist', async () => {
			await history.load()
			const data = history.getData()
			expect(data).toEqual([])
		})

		test('should load existing history file', async () => {
			const historyData: TRunHistory[] = [
				{
					timestamp: '2024-01-01T00:00:00.000Z',
					paths: ['src/'],
					options: { fix: true },
					status: 'success',
					filesChanged: 3,
					filesProcessed: 8
				},
				{
					timestamp: '2024-01-02T00:00:00.000Z',
					paths: ['components/'],
					options: { dryRun: true },
					status: 'success',
					filesChanged: 0,
					filesProcessed: 5
				}
			]

			await fs.writeFile(config.historyFile, JSON.stringify(historyData, null, 2))
			await history.load()

			const data = history.getData()
			expect(data).toHaveLength(2)
			expect(data[0].filesChanged).toBe(3)
			expect(data[1].filesChanged).toBe(0)
		})
	})

	describe('history operations', () => {
		test('should add run to history', async () => {
			const run1: TRunHistory = {
				timestamp: '2024-01-01T00:00:00.000Z',
				paths: ['src/'],
				options: { fix: true },
				status: 'success',
				filesChanged: 2,
				filesProcessed: 5
			}

			const run2: TRunHistory = {
				timestamp: '2024-01-02T00:00:00.000Z',
				paths: ['components/'],
				options: { dryRun: true, sort: true },
				status: 'success',
				filesChanged: 1,
				filesProcessed: 3
			}

			await history.addRun(run1)
			await history.addRun(run2)

			const data = history.getData()
			expect(data).toHaveLength(2)
			expect(data[0]).toEqual(run1)
			expect(data[1]).toEqual(run2)
		})

		test('should clear history', async () => {
			const run: TRunHistory = {
				timestamp: '2024-01-01T00:00:00.000Z',
				paths: ['src/'],
				options: { fix: true },
				status: 'success',
				filesChanged: 1,
				filesProcessed: 2
			}

			await history.addRun(run)
			expect(history.getData()).toHaveLength(1)

			await history.clear()
			expect(history.getData()).toHaveLength(0)

			const content = await fs.readFile(config.historyFile, 'utf-8')
			const parsed = JSON.parse(content)
			expect(parsed).toEqual([])
		})

		test('should handle corrupted history file', async () => {
			await fs.writeFile(config.historyFile, 'invalid json content')

			await history.load()
			const data = history.getData()
			expect(data).toEqual([])
		})
	})
})
