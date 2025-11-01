#!/usr/bin/env node

const { CodeMieAgent } = require('../dist/code/agent.js');
const { loadConfig } = require('../dist/code/config.js');
const { FilesystemTools } = require('../dist/code/tools/filesystem.js');

console.log('Testing live codemie-code output format...\n');
console.log('Running codemie-code with "list files" command...\n');
console.log('=' .repeat(80));

let output = '';
let hasToolCall = false;
let hasToolResult = false;
let hasLineTruncation = false;

async function runTest() {
  try {
    const config = loadConfig(process.cwd());

    const filesystemTools = new FilesystemTools({
      allowedDirectories: [process.cwd()]
    });
    const tools = filesystemTools.getTools();

    const agent = new CodeMieAgent(config, tools);

    await agent.chatStream('list files in current directory', (event) => {
      let text = '';

      switch (event.type) {
        case 'thinking_start':
        case 'thinking_end':
          // Silent
          break;

        case 'content_chunk':
          text = `⏺ ${event.content}`;
          output += text + '\n';
          process.stdout.write(text + '\n');
          break;

        case 'tool_call_start':
          text = `⏺ ${event.toolName}(${JSON.stringify(event.toolArgs).substring(0, 50)}...)`;
          output += text + '\n';
          process.stdout.write(text + '\n');
          hasToolCall = true;
          break;

        case 'tool_call_result':
          const lines = event.result.split('\n');
          const firstLine = lines[0];
          text = `  ⎿  ${firstLine}`;
          if (lines.length > 5) {
            text += `\n     … +${lines.length - 5} lines (ctrl+o to expand)`;
            hasLineTruncation = true;
          }
          output += text + '\n';
          process.stdout.write(text + '\n');
          hasToolResult = true;
          break;

        case 'complete':
          // Stream completed
          break;

        case 'error':
          console.error('Error:', event.error);
          break;
      }
    });

    console.log('\n' + '=' .repeat(80));
    console.log('\n✓ Output captured successfully!');

    // Check for expected format elements
    const checks = [
      { name: 'Green dot prefix', found: /⏺/.test(output) },
      { name: 'Tool call format', found: hasToolCall },
      { name: 'Tool result indent', found: hasToolResult },
      { name: 'Line truncation', found: hasLineTruncation }
    ];

    console.log('\nFormat validation:');
    checks.forEach(check => {
      const status = check.found ? '✓' : '✗';
      console.log(`  ${status} ${check.name}`);
    });

    const allPassed = checks.every(c => c.found);
    console.log(`\n${allPassed ? '✓ All format checks passed!' : '✗ Some format checks failed'}`);

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Timeout after 60s
setTimeout(() => {
  console.error('\n⏱️ Test timed out after 60 seconds');
  process.exit(1);
}, 60000);

runTest();
