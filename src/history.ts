import { promises as fs } from 'fs'

import { Config } from './config'
import { TRunHistory } from './types'

export class History {
	private data: TRunHistory[] = []

	constructor(private config: Config) {}

	async load() {
		try {
			const content = await fs.readFile(this.config.historyFile, 'utf-8')
			this.data = JSON.parse(content)
		} catch {
			this.data = []
		}
	}

	async save() {
		await fs.writeFile(this.config.historyFile, JSON.stringify(this.data, null, 2))
	}

	async addRun(run: TRunHistory) {
		this.data.push(run)
		await this.save()
	}

	async clear() {
		this.data = []
		await this.save()
	}

	getData(): TRunHistory[] {
		return this.data
	}
}
