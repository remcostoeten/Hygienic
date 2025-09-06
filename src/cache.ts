import { createHash } from 'crypto'
import { promises as fs } from 'fs'

import { Config } from './config'
import { TCacheData, TConsolidationResult } from './types'

export class Cache {
	private data: TCacheData = {}

	constructor(private config: Config) {}

	async load() {
		try {
			const content = await fs.readFile(this.config.cacheFile, 'utf-8')
			this.data = JSON.parse(content)
		} catch {
			this.data = {}
		}
	}

	async save() {
		if (this.config.get('cacheEnabled')) {
			await fs.writeFile(this.config.cacheFile, JSON.stringify(this.data, null, 2))
		}
	}

	private async getFileHash(filePath: string): Promise<string> {
		try {
			const content = await fs.readFile(filePath)
			return createHash('md5').update(content).digest('hex')
		} catch {
			return ''
		}
	}

	async isFileCached(filePath: string): Promise<boolean> {
		if (!this.config.get('cacheEnabled')) {
			return false
		}

		const currentHash = await this.getFileHash(filePath)
		const cachedHash = this.data[filePath]?.hash
		return currentHash === cachedHash && currentHash !== ''
	}

	async cacheFile(filePath: string, result: TConsolidationResult) {
		if (this.config.get('cacheEnabled')) {
			this.data[filePath] = {
				hash: await this.getFileHash(filePath),
				changed: result.changed,
				timestamp: new Date().toISOString()
			}
		}
	}
}
