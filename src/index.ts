// Main exports for CodeMie Code package

// Core
export { CodeMieCode } from './code/index';
export { CodeMieAgent } from './code/agent';
export { loadConfig } from './code/config';

// Tools
export { FilesystemTools } from './code/tools/filesystem';
export { CommandTools } from './code/tools/command';
export { GitTools } from './code/tools/git';
export { MCPTools } from './code/tools/mcp';

// Agents
export { AgentRegistry } from './agents/registry';
export type { AgentAdapter } from './agents/registry';

// Utils
export { logger } from './utils/logger';
export { exec } from './utils/exec';
export * from './utils/errors';

// Environment
export { EnvManager } from './env/manager';
