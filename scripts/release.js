#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const Colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`
};

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function execCommand(command, options = {}) {
  try {
    const output = execSync(command, { 
      encoding: 'utf-8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    return output?.trim();
  } catch (error) {
    if (!options.silent) {
      console.error(Colors.red(`Error executing: ${command}`));
      console.error(Colors.red(error.message));
    }
    throw error;
  }
}

function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(num => parseInt(num));
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

function updateVersionInFiles(newVersion) {
  console.log(Colors.blue(`Updating version to ${newVersion}...`));
  
  // Update package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  packageJson.version = newVersion;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  
  // Update CLI version
  const cliPath = 'src/cli.ts';
  let cliContent = fs.readFileSync(cliPath, 'utf-8');
  cliContent = cliContent.replace(/\.version\('.*?'\)/, `.version('${newVersion}')`);
  fs.writeFileSync(cliPath, cliContent);
  
  // Update help version
  const helpPath = 'src/help.ts';
  let helpContent = fs.readFileSync(helpPath, 'utf-8');
  helpContent = helpContent.replace(/const VERSION = '.*?';/, `const VERSION = '${newVersion}';`);
  fs.writeFileSync(helpPath, helpContent);
  
  console.log(Colors.green('✓ Version updated in all files'));
}

async function checkPrerequisites() {
  console.log(Colors.bold(Colors.cyan('\n🔍 Checking prerequisites...\n')));
  
  // Check if git is initialized
  try {
    execCommand('git status', { silent: true });
  } catch {
    console.error(Colors.red('❌ Not in a git repository'));
    process.exit(1);
  }
  
  // Check for uncommitted changes
  const status = execCommand('git status --porcelain', { silent: true });
  if (status) {
    console.log(Colors.yellow('⚠ Uncommitted changes detected:'));
    console.log(status);
    const proceed = await question(Colors.yellow('Continue anyway? (y/N): '));
    if (proceed.toLowerCase() !== 'y') {
      console.log(Colors.red('❌ Aborted'));
      process.exit(1);
    }
  }
  
  // Check if logged into npm
  try {
    const whoami = execCommand('npm whoami', { silent: true });
    console.log(Colors.green(`✓ Logged into npm as: ${whoami}`));
  } catch {
    console.error(Colors.red('❌ Not logged into npm. Run: npm login'));
    process.exit(1);
  }
  
  // Check if we have a GitHub remote
  try {
    const remote = execCommand('git remote get-url origin', { silent: true });
    console.log(Colors.green(`✓ GitHub remote: ${remote}`));
  } catch {
    console.error(Colors.red('❌ No GitHub remote found'));
    process.exit(1);
  }
  
  console.log(Colors.green('✓ All prerequisites met\n'));
}

async function main() {
  console.log(Colors.bold(Colors.magenta('🚀 Hygienic Release Manager\n')));
  
  await checkPrerequisites();
  
  // Get current version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const currentVersion = packageJson.version;
  
  console.log(Colors.blue(`Current version: ${currentVersion}`));
  
  // Ask for version increment type
  console.log(Colors.bold('\nVersion increment options:'));
  console.log('1. Patch (0.0.1 → 0.0.2)');
  console.log('2. Minor (0.0.1 → 0.1.0)'); 
  console.log('3. Major (0.0.1 → 1.0.0)');
  console.log('4. Custom version');
  
  const choice = await question(Colors.cyan('\nSelect increment type (1-4): '));
  
  let newVersion;
  switch (choice) {
    case '1':
      newVersion = incrementVersion(currentVersion, 'patch');
      break;
    case '2':
      newVersion = incrementVersion(currentVersion, 'minor');
      break;
    case '3':
      newVersion = incrementVersion(currentVersion, 'major');
      break;
    case '4':
      newVersion = await question(Colors.cyan('Enter custom version: '));
      break;
    default:
      console.log(Colors.red('Invalid choice'));
      process.exit(1);
  }
  
  console.log(Colors.green(`\n📦 New version will be: ${newVersion}`));
  
  // Ask for release notes
  const releaseNotes = await question(Colors.cyan('Enter release notes (optional): '));
  
  // Confirm release
  const confirm = await question(Colors.yellow(`\n⚠ This will:\n• Update version to ${newVersion}\n• Build the project\n• Run tests\n• Commit changes\n• Push to GitHub\n• Create GitHub release\n• Publish to npm\n\nProceed? (y/N): `));
  
  if (confirm.toLowerCase() !== 'y') {
    console.log(Colors.red('❌ Aborted'));
    process.exit(1);
  }
  
  try {
    console.log(Colors.bold(Colors.cyan('\n🔄 Starting release process...\n')));
    
    // 1. Update version in all files
    updateVersionInFiles(newVersion);
    
    // 2. Build project
    console.log(Colors.blue('Building project...'));
    execCommand('bun run build');
    console.log(Colors.green('✓ Build successful'));
    
    // 3. Run tests
    console.log(Colors.blue('Running tests...'));
    execCommand('bun test');
    console.log(Colors.green('✓ All tests passed'));
    
    // 4. Commit changes
    console.log(Colors.blue('Committing changes...'));
    execCommand('git add -A');
    execCommand(`git commit -m "chore: release v${newVersion}"`);
    console.log(Colors.green('✓ Changes committed'));
    
    // 5. Create and push tag
    console.log(Colors.blue('Creating git tag...'));
    execCommand(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
    console.log(Colors.green(`✓ Tag v${newVersion} created`));
    
    // 6. Push to GitHub
    console.log(Colors.blue('Pushing to GitHub...'));
    execCommand('git push origin main');
    execCommand(`git push origin v${newVersion}`);
    console.log(Colors.green('✓ Pushed to GitHub'));
    
    // 7. Create GitHub release (if gh CLI is available)
    try {
      console.log(Colors.blue('Creating GitHub release...'));
      const releaseTitle = `v${newVersion}`;
      const releaseBody = releaseNotes || `Release v${newVersion}`;
      execCommand(`gh release create v${newVersion} --title "${releaseTitle}" --notes "${releaseBody}"`);
      console.log(Colors.green('✓ GitHub release created'));
    } catch {
      console.log(Colors.yellow('⚠ GitHub CLI not found, skipping GitHub release creation'));
      console.log(Colors.dim('Install gh CLI or create release manually at: https://github.com/remcostoeten/hygienic/releases'));
    }
    
    // 8. Publish to npm
    console.log(Colors.blue('Publishing to npm...'));
    execCommand('npm publish');
    console.log(Colors.green('✓ Published to npm'));
    
    // Success
    console.log(Colors.bold(Colors.green(`\n🎉 Successfully released v${newVersion}!\n`)));
    console.log(Colors.cyan('Package available at:'));
    console.log(`📦 npm: https://www.npmjs.com/package/@remcostoeten/hygienic`);
    console.log(`🐙 GitHub: https://github.com/remcostoeten/hygienic/releases/tag/v${newVersion}`);
    console.log('\nInstall with:');
    console.log(Colors.bold(`bun add -g @remcostoeten/hygienic@${newVersion}`));
    
  } catch (error) {
    console.error(Colors.red(`\n❌ Release failed: ${error.message}`));
    console.log(Colors.yellow('\n🔄 You may need to manually clean up:'));
    console.log('• git reset HEAD~1 (to undo commit)');
    console.log(`• git tag -d v${newVersion} (to delete local tag)`);
    console.log(`• git push origin :v${newVersion} (to delete remote tag if pushed)`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(Colors.yellow('\n\n⚠ Release cancelled by user'));
  rl.close();
  process.exit(0);
});

main().catch(error => {
  console.error(Colors.red(`Fatal error: ${error.message}`));
  rl.close();
  process.exit(1);
});
