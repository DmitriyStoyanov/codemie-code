import { StructuredTool } from '@langchain/core/tools';
import { FilesystemTools } from './tools/filesystem';
import { CommandTools } from './tools/command';
import { GitTools } from './tools/git';
import { MCPTools } from './tools/mcp';
import { CodeMieAgent } from './agent';
import { loadConfig, CodeMieConfig } from './config';
import { logger } from '../utils/logger';
import { tipDisplay } from '../utils/tips';
import { asyncTipDisplay } from '../utils/async-tips';
import { TerminalUI } from '../ui/terminal-ui';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export class CodeMieCode {
  private agent: CodeMieAgent | null = null;
  private config: CodeMieConfig;
  private mcpTools: MCPTools | null = null;

  constructor(workingDir?: string) {
    this.config = loadConfig(workingDir);

    if (this.config.debug) {
      logger.setDebugEnabled(true);
    }
  }

  async initialize(options: { showTips?: boolean } = {}): Promise<void> {
    const { showTips = true } = options;

    logger.info('Initializing CodeMie Code...');

    // Show tips during initialization only if requested
    const initPromise = this.performInitialization();
    if (showTips) {
      asyncTipDisplay.showDuring(initPromise);
    }

    await initPromise;

    logger.success('CodeMie Code initialized');
    logger.info(`Working directory: ${this.config.workingDirectory}`);
    logger.info(`Model: ${this.config.model} (${this.config.provider})`);
  }

  private async performInitialization(): Promise<void> {
    // Collect all tools
    const tools: StructuredTool[] = [];

    // Filesystem tools
    const filesystemTools = new FilesystemTools({
      allowedDirectories: [this.config.workingDirectory]
    });
    tools.push(...filesystemTools.getTools());
    logger.debug(`Added ${filesystemTools.getTools().length} filesystem tools`);

    // Command tools
    const commandTools = new CommandTools({
      allowedDirectories: [this.config.workingDirectory]
    });
    tools.push(...commandTools.getTools());
    logger.debug(`Added ${commandTools.getTools().length} command tools`);

    // Git tools
    const gitTools = new GitTools(this.config.workingDirectory);
    tools.push(...gitTools.getTools());
    logger.debug(`Added ${gitTools.getTools().length} git tools`);

    // MCP tools - always try to initialize to check for configured servers
    // If mcpServers is undefined, MCPTools will load all available servers from config
    // If mcpServers is an empty array, no servers will be loaded
    // If mcpServers has values, only those specific servers will be loaded
    try {
      this.mcpTools = new MCPTools(this.config.workingDirectory);
      await this.mcpTools.initialize(this.config.mcpServers);
      const mcpToolsList = await this.mcpTools.getTools();
      if (mcpToolsList.length > 0) {
        tools.push(...mcpToolsList);
        logger.info(`Added ${mcpToolsList.length} MCP tools`);
      }
    } catch (error: any) {
      logger.warn(`Failed to initialize MCP tools: ${error.message}`);
    }

    // Create agent
    this.agent = new CodeMieAgent(this.config, tools);
    logger.info(`Total tools: ${tools.length}`);
  }

  async startInteractive(): Promise<void> {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    // Load tips from file
    const tips = this.loadTips();

    // Create terminal UI
    const ui = new TerminalUI({
      onSubmit: async (message: string) => {
        try {
          const response = await this.agent!.chat(message);
          ui.showAssistantResponse(response);
        } catch (error: any) {
          logger.error('Error during conversation:', error);
          ui.showError(error.message || 'An error occurred');
        }
      },
      onSubmitStream: async (message: string, onEvent, abortSignal?: AbortSignal) => {
        try {
          await this.agent!.chatStream(message, onEvent, abortSignal);
        } catch (error: any) {
          // Check if error is from cancellation
          if (error.message === 'Execution cancelled by user') {
            // Cancellation is already handled via event, no need to log as error
            return;
          }
          logger.error('Error during streaming conversation:', error);
          onEvent({ type: 'error', error: error.message || 'An error occurred' });
        }
      },
      onSlashCommand: async (command: string, args: string[]) => {
        return this.handleSlashCommand(command, args);
      },
      onClear: () => {
        // Clear the agent's conversation history
        this.agent!.clearHistory();
      },
      onExit: async () => {
        // Suppress stderr during cleanup to avoid terminfo errors
        const originalStderr = process.stderr.write;
        process.stderr.write = () => true;

        try {
          await this.dispose();
        } finally {
          // Restore stderr
          process.stderr.write = originalStderr;
        }

        process.exit(0);
      },
      workingDirectory: this.config.workingDirectory,
      model: this.config.model,
      provider: this.config.provider
    });

    // Set tips for rotation
    ui.setTips(tips);

    // Keep the process running
    return new Promise(() => {
      // This promise never resolves, keeping the UI active
      // The UI will handle exit via onExit callback
    });
  }

  private async handleSlashCommand(command: string, args: string[]): Promise<string> {
    try {
      // Build the codemie command
      const fullCommand = `codemie ${command} ${args.join(' ')}`;

      // Execute the command synchronously and capture output
      const output = execSync(fullCommand, {
        cwd: this.config.workingDirectory,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          CODEMIE_IN_ASSISTANT: 'true' // Flag to suppress tips in assistant context
        }
      });

      return output;
    } catch (error: any) {
      // If command fails, return the error output (stderr contains the actual error message)
      if (error.stderr || error.stdout) {
        const stderr = (error.stderr || '').trim();
        const stdout = (error.stdout || '').trim();
        const combined = [stdout, stderr].filter(Boolean).join('\n');
        throw new Error(combined || error.message);
      }
      throw new Error(`Command failed: ${error.message}`);
    }
  }

  private loadTips(): Array<{ message: string; command?: string }> {
    try {
      const tipsPath = path.join(__dirname, '../data/tips.json');
      const tipsData = fs.readFileSync(tipsPath, 'utf-8');
      return JSON.parse(tipsData);
    } catch (error) {
      return [
        { message: 'Run codemie list to see available agents', command: 'codemie list' },
        { message: 'Use codemie doctor to check your setup', command: 'codemie doctor' }
      ];
    }
  }

  async chat(message: string): Promise<string> {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    return await this.agent.chat(message);
  }

  async executeNonInteractive(task: string): Promise<void> {
    if (!this.agent) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    // Check if task is a slash command (proxy command)
    if (task.startsWith('/')) {
      const parts = task.slice(1).split(/\s+/);
      const command = parts[0];
      const args = parts.slice(1);

      console.log(chalk.yellow(`Executing command: /${command} ${args.join(' ')}`));
      console.log();

      try {
        const result = await this.executeSlashCommand(command, args);
        console.log(result);
        process.exit(0);
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
      return;
    }

    // Execute as agent task with streaming output
    console.log(chalk.cyan('Task:'), task);
    console.log();

    let hasOutput = false;
    let hasError = false;
    let isThinking = false;

    // Create AbortController for cancellation (Ctrl+C in non-interactive mode)
    const abortController = new AbortController();
    const abortHandler = () => {
      console.log(chalk.yellow('\nCancelling execution...'));
      abortController.abort();
    };
    process.once('SIGINT', abortHandler);

    try {
      await this.agent.chatStream(task, (event) => {
        switch (event.type) {
          case 'thinking_start':
            if (!isThinking) {
              process.stderr.write(chalk.gray('(thinking...)'));
              isThinking = true;
            }
            break;

          case 'thinking_end':
            // Clear the thinking line
            if (isThinking) {
              process.stderr.write('\r\x1b[K'); // Clear line
              isThinking = false;
            }
            break;

          case 'content_chunk':
            // Clear thinking indicator if still showing
            if (isThinking) {
              process.stderr.write('\r\x1b[K');
              isThinking = false;
            }
            if (!hasOutput) {
              hasOutput = true;
            }
            process.stdout.write(event.content);
            break;

          case 'tool_call_start':
            // Clear thinking indicator if still showing
            if (isThinking) {
              process.stderr.write('\r\x1b[K');
              isThinking = false;
            }
            console.log();
            console.log(chalk.green('⏺'), chalk.white(`${event.toolName}(${Object.values(event.toolArgs || {}).join(', ')})`));
            break;

          case 'tool_call_result':
            // Truncate long results
            const lines = event.result?.split('\n') || [];
            const maxLines = 5;
            const displayLines = lines.slice(0, maxLines);

            console.log(chalk.gray('  ⎿'), displayLines[0] || '');
            for (let i = 1; i < displayLines.length; i++) {
              console.log('    ', displayLines[i]);
            }
            if (lines.length > maxLines) {
              console.log(chalk.gray(`     … +${lines.length - maxLines} lines`));
            }
            console.log();
            break;

          case 'tool_call_error':
            console.log(chalk.red('⏺ Error:'), event.error);
            console.log();
            break;

          case 'complete':
            // Clear thinking indicator if still showing
            if (isThinking) {
              process.stderr.write('\r\x1b[K');
              isThinking = false;
            }
            if (hasOutput) {
              console.log(); // Add newline after final output
            }
            break;

          case 'error':
            hasError = true;
            // Clear thinking indicator if still showing
            if (isThinking) {
              process.stderr.write('\r\x1b[K');
              isThinking = false;
            }
            console.error(chalk.red('Error:'), event.error);
            break;

          case 'cancelled':
            // Clear thinking indicator if still showing
            if (isThinking) {
              process.stderr.write('\r\x1b[K');
              isThinking = false;
            }
            console.log();
            console.log(chalk.yellow('Execution cancelled.'));
            break;
        }
      }, abortController.signal);

      process.removeListener('SIGINT', abortHandler);
      process.exit(hasError ? 1 : 0);

    } catch (error: any) {
      process.removeListener('SIGINT', abortHandler);
      // Clear thinking indicator if still showing
      if (isThinking) {
        process.stderr.write('\r\x1b[K');
      }
      // Check if error is from cancellation
      if (error.message === 'Execution cancelled by user') {
        process.exit(130); // Standard exit code for SIGINT
      }
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }

  private async executeSlashCommand(command: string, args: string[]): Promise<string> {
    // Build the codemie command
    const fullCommand = `codemie ${command} ${args.join(' ')}`;

    // Execute the command synchronously and capture output
    const output = execSync(fullCommand, {
      cwd: this.config.workingDirectory,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return output;
  }

  async dispose(): Promise<void> {
    if (this.mcpTools) {
      await this.mcpTools.dispose();
    }
  }

  static async testConnection(): Promise<void> {
    try {
      const config = loadConfig();
      logger.info(`Testing ${config.provider} connection...`);
      logger.info(`Base URL: ${config.baseUrl}`);
      logger.info(`Model: ${config.model}`);

      // Simple test to verify credentials
      const testAgent = new CodeMieAgent(config, []);
      logger.success('Connection test successful!');
    } catch (error: any) {
      logger.error('Connection test failed:', error);
      throw error;
    }
  }
}
