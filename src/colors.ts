import chalk from 'chalk';

export const Colors = {
  red: chalk.red,
  green: chalk.green,
  yellow: chalk.yellow,
  blue: chalk.blue,
  magenta: chalk.magenta,
  cyan: chalk.cyan,
  white: chalk.white,
  dim: chalk.dim,
  bold: chalk.bold,
  underline: chalk.underline,
  reset: (text: string) => text
};
