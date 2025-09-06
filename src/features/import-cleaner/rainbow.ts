import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

type TRainbowOptions = {
  animate?: boolean;
  duration?: number;
  seed?: number;
  spread?: number;
  freq?: number;
};

/**
 * Output text with rainbow colors using lolcat
 * Falls back to chalk colors if lolcat is not available
 */
export async function rainbow(text: string, options: TRainbowOptions = {}): Promise<void> {
  try {
    const flags = buildLolcatFlags(options);
    const { stdout } = await execAsync(`echo "${text}" | lolcat ${flags}`);
    process.stdout.write(stdout);
  } catch {
    // Fallback to chalk gradient if lolcat not available
    console.log(chalk.hex('#ff0000')(text.slice(0, text.length / 3)) +
                chalk.hex('#00ff00')(text.slice(text.length / 3, 2 * text.length / 3)) +
                chalk.hex('#0000ff')(text.slice(2 * text.length / 3)));
  }
}

/**
 * Check if lolcat is installed
 */
export async function hasLolcat(): Promise<boolean> {
  try {
    await execAsync('which lolcat');
    return true;
  } catch {
    return false;
  }
}

/**
 * Display banner with rainbow effect
 */
export async function showRainbowBanner(title: string, version: string): Promise<void> {
  const banner = `
╔═══════════════════════════════════════════╗
║  ${title.padEnd(40)}  ║
║  Version: ${version.padEnd(31)}  ║
║  Author: Remco Stoeten @remcostoeten     ║
╚═══════════════════════════════════════════╝
`;
  
  await rainbow(banner, { animate: true, duration: 2 });
}

/**
 * Display success message with rainbow effect
 */
export async function rainbowSuccess(message: string): Promise<void> {
  const successBox = `
✨ SUCCESS ✨
${message}
${'─'.repeat(50)}
`;
  
  await rainbow(successBox, { spread: 3.0 });
}

/**
 * Display statistics with rainbow effect
 */
export async function rainbowStats(stats: {
  filesProcessed: number;
  importsRemoved: number;
  timeTaken: number;
}): Promise<void> {
  const statsDisplay = `
📊 STATISTICS 📊
├─ Files Processed: ${stats.filesProcessed}
├─ Imports Removed: ${stats.importsRemoved}
└─ Time Taken: ${stats.timeTaken}ms
`;
  
  await rainbow(statsDisplay, { freq: 0.1 });
}

function buildLolcatFlags(options: TRainbowOptions): string {
  const flags: string[] = [];
  
  if (options.animate) flags.push('-a');
  if (options.duration) flags.push(`-d ${options.duration}`);
  if (options.seed) flags.push(`-s ${options.seed}`);
  if (options.spread) flags.push(`-p ${options.spread}`);
  if (options.freq) flags.push(`-F ${options.freq}`);
  
  return flags.join(' ');
}

/**
 * Install lolcat suggestion
 */
export function suggestLolcatInstall(): void {
  console.log(chalk.yellow('\n💡 Tip: Install lolcat for rainbow output!'));
  console.log(chalk.gray('   Run: npm install -g lolcat'));
  console.log(chalk.gray('   Or:  sudo apt install lolcat (on Ubuntu/Debian)'));
  console.log(chalk.gray('   Or:  brew install lolcat (on macOS)\n'));
}
