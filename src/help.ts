import { Colors } from './colors';
import open from 'open';
import { noop } from './utils/noop';
const VERSION = '0.0.1';
const AUTHOR = 'Remco Stoeten (@remcostoeten on GitHub)';
const GITHUB_URL = 'https://github.com/remcostoeten';
export async function showHelp() {
  const helpText = `
${Colors.bold(Colors.cyan(`Hygienic v${VERSION}`))}
${Colors.blue(`Made by ${AUTHOR}`)}
${Colors.dim('Code hygiene tool that consolidates and normalizes imports across your codebase.')}

${Colors.bold('USAGE:')}
  hygienic [OPTIONS] [PATHS...]

${Colors.bold('PATHS:')}
  <file.tsx>      Process single file
  <directory>     Process all .tsx files in directory  
  (no path)       Process entire src directory

${Colors.bold('OPTIONS:')}
  ${Colors.green('--fix')}               Apply changes (default is dry-run)
  ${Colors.green('--sort')}              Sort consolidated imports alphabetically
  ${Colors.green('--force, -f')}         Run even with uncommitted git changes
  ${Colors.green('--verbose')}           Show detailed logs
  ${Colors.green('--quiet')}             Show minimal logs
  ${Colors.green('--check')}             Exit non-zero if files need consolidation
  ${Colors.green('--except <glob>')}     Exclude files/folders
  ${Colors.green('--include <glob>')}    Include specific files
  ${Colors.green('--barrel <path>')}     Add barrel file path
  ${Colors.green('--no-cache')}          Disable incremental cache
  ${Colors.green('--report')}            Generate report file
  ${Colors.green('--revert')}            Restore latest backup
  ${Colors.green('--config')}            Interactive configuration
  ${Colors.green('--history')}           Show run history
  ${Colors.green('--clear-history')}     Clear stored history
  ${Colors.green('--disable-history')}   Disable history tracking

${Colors.bold('EXAMPLES:')}
  hygienic .
  hygienic src --fix
  hygienic src --fix --sort
  hygienic src/pages/home.tsx --fix
  hygienic "src/**/*.{ts,tsx}" --check

${Colors.bold('Last updated:')}

${Colors.yellow('Press SPACEBAR to open GitHub profile...')}
`;
  console.log(helpText);
  try {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', async (key) => {
      if (key[0] === 32) {
        await open(GITHUB_URL);
        console.log(Colors.green('Opening GitHub profile...'));
        process.exit(0);
      } else {
        process.exit(0);
      }
    });
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  } catch {
    noop();
  }
}
