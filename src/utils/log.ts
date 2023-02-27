import chalk from 'chalk';

export function log(module: string, ...message: string[]) {
  console.log(chalk.bold.blue(`[${module}]`), message.join(' '));
}