# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical First Step: ALWAYS Read Documentation

**MANDATORY**: Before writing ANY code, you MUST:
1. Read the `README.md` file - this is your PRIMARY source of truth
2. Review this CLAUDE.md for architectural patterns and conventions
3. Study reference implementations mentioned in this guide

## Common Commands

```bash
# Installation & Setup
npm install                 # Install dependencies
npm link                    # Link globally for local testing

# Building
npm run build              # Compile TypeScript and copy assets (to dist/)
npm run dev                # Watch mode for development

# Testing
npm test                   # Run all tests with Jest
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report

# Manual integration tests (not part of npm test)
node tests/test-agent-direct.js
node tests/test-streaming.js
node tests/test-ui-state.js

# Code Quality
npm run lint               # Check code style with ESLint
npm run lint:fix           # Fix linting issues automatically

# Development Workflow
npm run build && npm link  # Build and link for testing
codemie doctor             # Verify installation and configuration
```

## Critical Policies

### Testing & Documentation Policy

**IMPORTANT - Do NOT write or run tests unless explicitly requested:**
- Do NOT write tests unless user explicitly says: "Write tests", "Create unit tests", etc.
- Do NOT run tests unless user explicitly says: "Run the tests", "Execute test suite", etc.
- Do NOT generate documentation unless explicitly requested
- Do NOT run compilation checks unless explicitly requested

### Node Modules Policy

**IMPORTANT:**
- NEVER modify files inside `node_modules/`
- All source code lives in `src/`
- All tests live in `tests/`
- Build output goes to `dist/`

### Utilities Policy

**Before implementing new utility functions:**
1. Check if similar functionality exists in `src/utils/` directory
2. Always reuse existing utilities (logger, exec, errors, tips, etc.)
3. If implementing new shared utilities, get user approval first

## Reference Implementations

Study these excellent examples before implementing new code:
- **AI Assistant** (`src/code/`) - Complete ReAct agent implementation with streaming
- **Tool System** (`src/code/tools/`) - Filesystem, Git, Command, and MCP tools
- **UI Layer** (`src/ui/terminal-ui.ts`) - Interactive terminal with cancellation support
- **Agent System** (`src/agents/`) - Agent registry and adapters pattern

## Communication Style

When responding:
1. Confirm your understanding of the request
2. Reference which patterns you're following from existing code
3. Outline your implementation approach
4. Present complete, working code
5. Explain key design decisions
6. Highlight any assumptions requiring user input

## Self-Verification Before Delivery

- [ ] README.md and CLAUDE.md have been read and understood
- [ ] Reference implementations reviewed for similar patterns
- [ ] Code follows TypeScript best practices and project conventions
- [ ] No tests written (unless explicitly requested)
- [ ] No tests executed (unless explicitly requested)
- [ ] Code is production-ready and follows DRY/KISS principles

## Escalation Scenarios

Seek user guidance when:
- Documentation is missing, unclear, or contradictory
- New dependencies are required
- Breaking changes are necessary
- Multiple valid approaches exist
- Reference implementations don't cover the use case
- Security or architectural concerns arise

## Project Overview

**CodeMie Code** is a unified npm package that provides:
- A built-in AI coding assistant powered by LiteLLM (via LangChain)
- A CLI wrapper for managing multiple AI coding agents (Claude Code, Aider, Codex)

The project uses TypeScript with a ReAct agent pattern via LangGraph for autonomous tool execution.

## Quick Architecture Overview

### Core Components

- **AI Assistant** (`src/code/`): Main assistant class, agent, configuration, prompts
- **Tool System** (`src/code/tools/`): Filesystem, Git, Command execution, MCP integration
- **CLI Wrapper** (`src/cli/commands/`): Commands for managing external agents
- **Agent System** (`src/agents/`): Registry and adapters for different AI agents
- **UI Layer** (`src/ui/`): Interactive terminal with streaming and cancellation
- **Environment** (`src/env/`, `src/utils/`): Config management and utilities

### Entry Points
- `bin/codemie-code.js` - Starts the AI assistant
- `bin/codemie.js` - CLI wrapper for agent management

### Key Design Patterns

#### ReAct Agent Pattern
Uses LangGraph's `createReactAgent`:
1. **Reasoning** - LLM thinks about what to do
2. **Acting** - Calls tools based on reasoning
3. **Observing** - Receives tool results
4. Loops until task is complete

#### Streaming Architecture
Agent supports streaming via `chatStream()`:
- `thinking_start/end` - Agent is reasoning
- `tool_call_start` - Tool invocation begins
- `tool_call_result` - Tool returns result
- `content_chunk` - Partial response content
- `complete/cancelled/error` - Terminal states

#### Security Model
All filesystem/command operations validate:
- Paths must be within `allowedDirectories`
- Symlinks are resolved and validated
- Dangerous command patterns are blocked
- Ignore patterns exclude sensitive dirs

## Project Structure

```
codemie-code/
├── bin/
│   ├── codemie-code.js          # AI assistant entry point
│   └── codemie.js               # CLI wrapper entry point
│
├── src/
│   ├── code/                    # CodeMie Code Assistant
│   │   ├── index.ts             # Main assistant class
│   │   ├── agent.ts             # LangChain ReAct agent
│   │   ├── agent-events.ts      # Event system for streaming
│   │   ├── config.ts            # Configuration loader
│   │   ├── prompts.ts           # System prompts
│   │   └── tools/               # Tool implementations
│   │       ├── filesystem.ts    # 8 filesystem tools
│   │       ├── git.ts           # 4 git tools
│   │       ├── command.ts       # Command execution
│   │       ├── mcp.ts           # MCP integration
│   │       └── diff-utils.ts    # Diff utilities
│   │
│   ├── cli/                     # CLI Wrapper
│   │   └── commands/            # CLI commands
│   │       ├── list.ts
│   │       ├── install.ts
│   │       ├── run.ts
│   │       ├── doctor.ts
│   │       ├── uninstall.ts
│   │       └── version.ts
│   │
│   ├── agents/                  # Agent System
│   │   ├── registry.ts          # Agent registry
│   │   └── adapters/            # Agent adapters
│   │       ├── codemie-code.ts
│   │       ├── claude-code.ts
│   │       ├── codex.ts
│   │       └── aider.ts
│   │
│   ├── env/                     # Environment Management
│   │   └── manager.ts
│   │
│   ├── ui/                      # UI Layer
│   │   └── terminal-ui.ts       # Interactive terminal
│   │
│   └── utils/                   # Utilities
│       ├── env-mapper.ts        # Environment variable mapping
│       ├── exec.ts              # Process execution
│       ├── logger.ts            # Logging
│       ├── errors.ts            # Error classes
│       └── tips.ts              # Loading tips
│
├── tests/                       # Test files
│   ├── test-*.js                # Manual integration tests
│   └── integration/             # Additional test scenarios
│
├── dist/                        # Build output (TypeScript compilation)
├── mcp/                         # MCP server configurations
│   └── servers.json
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── eslint.config.mjs            # ESLint configuration
└── README.md                    # Package documentation
```

## Technology Stack

- **Language**: TypeScript (ES2022, NodeNext modules)
- **Runtime**: Node.js >= 18.0.0
- **Package Manager**: npm
- **LLM Framework**: LangChain 1.x (`@langchain/core`, `@langchain/langgraph`, `@langchain/openai`)
- **LLM Provider**: LiteLLM (OpenAI-compatible proxy)
- **CLI Framework**: Commander.js
- **Schema Validation**: Zod
- **Diff Generation**: diff package
- **UI**: Chalk, Inquirer, Ora
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript support

## Configuration & Environment

### Environment Variable Priority
The config loader (`src/utils/env-mapper.ts`) checks in order:
1. `ANTHROPIC_*` - For Claude models
2. `OPENAI_*` - For GPT models
3. `AI_*` - Generic provider-agnostic
4. `LITELLM_*` - Legacy format (still supported)

### Required Environment Variables

```bash
# Provider-specific (choose one set)

# For Anthropic Claude models
ANTHROPIC_BASE_URL=https://litellm-proxy.example.com
ANTHROPIC_AUTH_TOKEN=your-token
ANTHROPIC_MODEL=claude-4-5-sonnet

# OR for OpenAI models
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your-token
OPENAI_MODEL=gpt-4

# OR generic provider-agnostic
AI_BASE_URL=https://litellm-proxy.example.com
AI_AUTH_TOKEN=your-token
AI_MODEL=claude-4-5-sonnet
```

### Optional Environment Variables

```bash
CODEMIE_DEBUG=true                           # Enable debug logging
CODEMIE_MODEL=claude-opus                    # Override model
CODEMIE_MCP_SERVERS=filesystem,cli-mcp-server # Load specific MCP servers
AI_TIMEOUT=300                               # Request timeout in seconds
```

### MCP Configuration
MCP servers are defined in:
1. `mcp/servers.json` - Default server configurations
2. `~/.codemie/config.json` - User-specific MCP config

MCP integration is handled by `src/code/tools/mcp.ts` which dynamically loads tools from configured servers.

## Development Guidelines

### File Naming Conventions

- **Modules**: kebab-case (e.g., `terminal-ui.ts`, `agent-events.ts`)
- **Classes**: PascalCase (e.g., `CodeMieCode`, `CodeMieAgent`)
- **Functions**: camelCase (e.g., `loadConfig`, `getTools`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `SYSTEM_PROMPT`)
- **Tests**: `test-*.js` or `*.test.ts`

### Code Style

- **Formatter**: TypeScript default (2 spaces)
- **Line Length**: No strict limit, but keep reasonable
- **Quotes**: Single quotes preferred
- **Semicolons**: Required
- **Imports**: Organized (standard library, third-party, local)
- **Type Hints**: Use TypeScript types throughout
- **Async/Await**: Preferred over promises/callbacks

### Import Organization

```typescript
// Third-party imports
import { ChatOpenAI } from '@langchain/openai';
import { StructuredTool } from '@langchain/core/tools';
import chalk from 'chalk';

// Local imports
import { CodeMieConfig } from './config';
import { logger } from '../utils/logger';
import { FilesystemTools } from './tools/filesystem';
```

## Tool Development

### Adding New Filesystem Tools

Extend `FilesystemTools` class in `src/code/tools/filesystem.ts`:
1. Create tool using `new StructuredTool()` with Zod schema
2. Add validation via `validatePath()` or `validateInAllowedDirectory()`
3. Push to tools array in constructor
4. Handle errors with try-catch, return error messages

Example:
```typescript
const myNewTool = new StructuredTool({
  name: "my_new_tool",
  description: "Description of what this tool does",
  schema: z.object({
    path: z.string().describe("File path"),
    content: z.string().describe("File content")
  }),
  func: async ({ path, content }) => {
    try {
      const fullPath = this.validatePath(path);
      // Tool implementation
      return "Success message";
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
});
```

### Adding New Git Tools

Extend `GitTools` class in `src/code/tools/git.ts` following the same pattern.

### Diff-Based Editing

The `edit_file` tool uses `diff` package to generate unified diffs:
- Preserves indentation (tabs vs spaces)
- Shows clear before/after changes
- Validates file exists before editing

## Agent Adapters

To add a new agent adapter (e.g., for Cursor or Copilot):

1. Create `src/agents/adapters/my-agent.ts` implementing `AgentAdapter` interface
2. Register in `src/agents/registry.ts`
3. Implement required methods:
   - `install()` - Install the agent
   - `uninstall()` - Uninstall the agent
   - `isInstalled()` - Check if installed
   - `run(args)` - Run the agent
   - `getVersion()` - Get version info

Example:
```typescript
export class MyAgentAdapter implements AgentAdapter {
  name = 'my-agent';
  displayName = 'My Agent';
  description = 'Description of my agent';

  async install(): Promise<void> { /* ... */ }
  async uninstall(): Promise<void> { /* ... */ }
  async isInstalled(): Promise<boolean> { /* ... */ }
  async run(args: string[]): Promise<void> { /* ... */ }
  async getVersion(): Promise<string | null> { /* ... */ }
}
```

## Error Handling

### Standard Error Pattern

```typescript
try {
  // Operation
  const result = await performOperation();
  return result;
} catch (error: any) {
  // Log error for debugging
  logger.error('Operation failed:', error);

  // Return user-friendly error message
  throw new Error(`Operation failed: ${error.message}`);
}
```

### Custom Error Classes

Located in `src/utils/errors.ts`:
- `ConfigurationError` - Configuration issues
- Use standard `Error` for most cases

## Testing Approach

- Unit tests use Jest (configured in package.json with ts-jest)
- Integration tests are manual Node.js scripts in `tests/`
- Test agent behavior with `tests/test-agent-direct.js`
- Test streaming with `tests/test-streaming.js`
- Test UI with `tests/test-ui-state.js`

### Running Tests

```bash
# Run all Jest tests
npm test

# Run specific test file
npm test -- path/to/test

# Run with coverage
npm run test:coverage

# Run manual integration tests
node tests/test-streaming.js
```

## Debugging

Enable debug mode to see detailed execution:

```bash
export CODEMIE_DEBUG=true
codemie-code
```

This shows:
- Tool initialization counts
- LLM request/response details
- File operation details
- Error stack traces

## Important Notes

### Module System
- Uses ES modules (`"module": "NodeNext"`)
- Import paths use `.js` extensions even for `.ts` files
- Example: `import { logger } from '../utils/logger.js'`

### TypeScript Configuration
- Strict mode enabled
- Declaration maps for debugging
- Output to `dist/` directory
- Source maps enabled

### LangChain Version
- Uses LangChain 1.x ecosystem
- `@langchain/core` for base types
- `@langchain/langgraph` for agent creation
- `@langchain/openai` for ChatOpenAI model

### Not a Git Repository
- This directory is NOT initialized as a git repository
- It's a package within a larger monorepo structure

## Build Process

The build process (`npm run build`):
1. Compiles TypeScript from `src/` to `dist/`
2. Copies `src/data/tips.json` to `dist/data/`
3. Generates declaration files (`.d.ts`)
4. Generates source maps

## Common Patterns & Utilities

### Configuration Loading
See `src/code/config.ts` and `src/utils/env-mapper.ts` for how configuration is loaded with fallbacks.

### Logging
Use the shared logger from `src/utils/logger.ts`:
```typescript
import { logger } from '../utils/logger';

logger.info('Information message');
logger.success('Success message');
logger.error('Error message');
logger.debug('Debug message');  // Only shown when CODEMIE_DEBUG=true
```

### Process Execution
Use utilities from `src/utils/exec.ts` for running commands.

### Tips System
Loading tips are displayed during initialization from `src/data/tips.json`.

## Best Practices

1. **Modular Design**: Each component should have clear separation of concerns
2. **Error Handling**: Always handle errors gracefully with user-friendly messages
3. **Security**: Validate all paths and commands before execution
4. **Reusability**: Utilize shared utilities from `src/utils/`
5. **Documentation**: Provide comprehensive JSDoc comments for all public methods
6. **TypeScript**: Use proper types throughout, avoid `any` when possible
7. **Testing**: Write tests for new functionality when requested
8. **Async/Await**: Handle async operations properly with try-catch

## Troubleshooting

### Issue: Command not found after installation
**Solution**: Re-link the package
```bash
npm link
which codemie
which codemie-code
```

### Issue: TypeScript compilation errors
**Solution**: Clean build
```bash
rm -rf dist/
npm run build
```

### Issue: Import errors
**Solution**: Check import paths use `.js` extensions and are correct

### Issue: Environment variables not loaded
**Solution**: Check variable names match the priority order and verify with:
```bash
echo $ANTHROPIC_BASE_URL
echo $AI_BASE_URL
codemie doctor
```

## Support

For questions or issues:
- Review existing implementations in `src/`
- Check test examples in `tests/`
- Consult utilities in `src/utils/`
- Read comprehensive `README.md`
