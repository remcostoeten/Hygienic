#!/usr/bin/env node
import { Command } from 'commander'
import { promises as fs } from 'fs'
import { join } from 'path'

import { Colors } from './colors'
import { Config } from './config'
import { UIImportConsolidator } from './consolidator'
import { showHelp } from './help'
import { History } from './history'
import { interactiveConfig, interactiveHistory } from './interactive'
import { TRunHistory } from './types'

const program = new Command()

async function main() {
	program
		.name('hygienic')
		.description(
			'Hygienic is a code hygiene tool that consolidates and normalizes imports across your codebase.'
		)
		.version('0.0.1')
		.arguments('[paths...]')
		.option('--help-extended', 'Show extended help')
		.option('--fix', 'Apply changes (default is dry-run)')
		.option('--dry-run', 'Show changes without applying')
		.option('--sort', 'Sort imports alphabetically')
		.option('-f, --force', 'Force run with uncommitted changes')
		.option('--verbose', 'Verbose output')
		.option('--quiet', 'Minimal output')
		.option('--check', 'Check mode for CI')
		.option('--except <patterns...>', 'Exclude patterns')
		.option('--include <patterns...>', 'Include patterns')
		.option('--barrel <paths...>', 'Additional barrel files')
		.option('--no-cache', 'Disable cache')
		.option('--report', 'Generate report')
		.option('--revert', 'Revert latest backup')
		.option('--config', 'Interactive config')
		.option('--history', 'Show history')
		.option('--clear-history', 'Clear history')
		.option('--disable-history', 'Disable history')

	program.parse()

	const options = program.opts()
	const paths = program.args.length > 0 ? program.args : ['src']

	if (options.helpExtended) {
		await showHelp()
		return 0
	}

	const config = new Config()
	await config.initialize()

	if (options.config) {
		await interactiveConfig(config)
		return 0
	}

	if (options.history) {
		const history = new History(config)
		await history.load()
		interactiveHistory(history)
		return 0
	}

	if (options.clearHistory) {
		const history = new History(config)
		await history.clear()
		console.log(Colors.green('History cleared.'))
		return 0
	}

	if (options.barrel) {
		const currentBarrels = config.get('barrelPaths')
		await config.set('barrelPaths', [...currentBarrels, ...options.barrel])
	}

	const consolidator = new UIImportConsolidator(config, options.verbose, options.quiet)
	await consolidator.initialize()

	if (!(await consolidator.checkGitStatus(options.force))) {
		return 4
	}

	await consolidator.cleanupOldBackups()

	const dryRun = options.dryRun || !options.fix
	const useCache = !options.noCache
	const sortImports = options.sort || config.get('sortImports')

	try {
		const results = await consolidator.processFiles(
			paths,
			dryRun,
			sortImports,
			options.include,
			options.except,
			useCache
		)

		const filesChanged = results.filter(r => r.changed).length
		const filesProcessed = results.length

		if (!options.disableHistory) {
			const history = new History(config)
			await history.load()

			const runHistory: TRunHistory = {
				timestamp: new Date().toISOString(),
				paths,
				options,
				status: 'success',
				filesChanged,
				filesProcessed
			}

			await history.addRun(runHistory)
		}

		console.log(Colors.bold('\nSummary:'))
		console.log(`  Files processed: ${filesProcessed}`)
		console.log(`  Files changed: ${filesChanged}`)

		if (options.check && filesChanged > 0) {
			return 1
		}

		if (options.report) {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
			const reportFile = join(config.reportsDir, `${timestamp}.json`)

			const reportData = {
				timestamp: new Date().toISOString(),
				summary: {
					filesProcessed,
					filesChanged
				},
				results
			}

			await fs.writeFile(reportFile, JSON.stringify(reportData, null, 2))
			console.log(`Report saved to: ${reportFile}`)
		}

		return 0
	} catch (error) {
		console.error(Colors.red(`Error: ${error}`))
		return 2
	}
}

if (require.main === module) {
	main().then(code => process.exit(code))
}
