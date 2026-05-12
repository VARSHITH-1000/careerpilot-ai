import chalk from "chalk";

/**
 * Standardized server-side logger.
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(chalk.blue("[INFO]"), message, ...args);
  },
  success: (message: string, ...args: any[]) => {
    console.log(chalk.green("[SUCCESS]"), message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(chalk.yellow("[WARN]"), message, ...args);
  },
  error: (message: string, error?: unknown, ...args: any[]) => {
    console.error(chalk.red("[ERROR]"), message, ...args);
    if (error instanceof Error) {
      console.error(chalk.red(`       ${error.message}`));
      if (error.stack) {
        console.error(chalk.dim(error.stack));
      }
    } else if (error) {
      console.error(chalk.red(String(error)));
    }
  },
};
