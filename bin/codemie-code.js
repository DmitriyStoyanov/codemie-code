#!/usr/bin/env node

/**
 * CodeMie Code - AI Coding Assistant
 * Entry point for the codemie-code executable
 */

const { runCLI } = require('../dist/cli/cli.js');
const { logger } = require('../dist/utils/logger.js');

async function main() {
  try {
    await runCLI();
  } catch (error) {
    logger.error('Failed to run CodeMie Code:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
