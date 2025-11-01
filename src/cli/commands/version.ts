import { Command } from 'commander';
import chalk from 'chalk';

export function createVersionCommand(): Command {
  const command = new Command('version');

  command
    .description('Show version information')
    .action(() => {
      try {
        const packageJson = require('../../../package.json');
        console.log(chalk.bold(`\nCodeMie Code v${packageJson.version}\n`));
      } catch {
        console.log(chalk.yellow('\nVersion information not available\n'));
      }
    });

  return command;
}
