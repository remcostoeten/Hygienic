import { createInterface } from 'readline'

import { Colors } from './colors'
import { Config } from './config'
import { History } from './history'

export async function interactiveConfig(config: Config) {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout
	})

	function question(query: string): Promise<string> {
		return new Promise(resolve => rl.question(query, resolve))
	}

	console.log(Colors.bold(Colors.blue('Interactive Configuration')))
	console.log('Current configuration:')

	for (const [key, value] of Object.entries(config.data)) {
		console.log(`  ${key}: ${JSON.stringify(value)}`)
	}

	console.log(Colors.yellow('\nPress Enter to keep current values, or type new values:'))

	for (const [key, currentValue] of Object.entries(config.data)) {
		if (Array.isArray(currentValue)) {
			const currentStr = currentValue.join(', ')
			const newValue = await question(`${key} [${currentStr}]: `)
			if (newValue.trim()) {
				await config.set(
					key as any,
					newValue.split(',').map(s => s.trim())
				)
			}
		} else if (typeof currentValue === 'boolean') {
			const newValue = await question(`${key} [${currentValue}] (true/false): `)
			if (
				newValue.trim().toLowerCase() === 'true' ||
				newValue.trim().toLowerCase() === 'false'
			) {
				await config.set(key as any, newValue.trim().toLowerCase() === 'true')
			}
		} else {
			const newValue = await question(`${key} [${currentValue}]: `)
			if (newValue.trim()) {
				await config.set(key as any, newValue.trim())
			}
		}
	}

	rl.close()
	console.log(Colors.green('Configuration saved!'))
}

export function interactiveHistory(history: History) {
	const data = history.getData()

	if (data.length === 0) {
		console.log(Colors.yellow('No history found.'))
		return
	}

	console.log(Colors.bold(Colors.blue('Run History')))
	const recent = data.slice(-10).reverse()

	recent.forEach((run, i) => {
		console.log(
			`${(i + 1).toString().padStart(2)}. [${run.timestamp}] ${run.status} - ${run.filesChanged}/${run.filesProcessed} files`
		)
		console.log(
			`    Paths: ${run.paths.slice(0, 3).join(', ')}${run.paths.length > 3 ? '...' : ''}`
		)

		const activeOptions = Object.entries(run.options)
			.filter(([_, value]) => value)
			.map(([key, _]) => `--${key}`)
			.join(', ')

		console.log(`    Options: ${activeOptions}`)
		console.log()
	})
}
