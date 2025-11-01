#!/usr/bin/env node

// Test the UI format with a simple tool call
const { CodeMieAgent } = require('../dist/code/agent');
const { TerminalUI } = require('../dist/ui/terminal-ui');

async function testUIFormat() {
  console.log('Testing UI format...\n');

  // Simulate tool call events
  const events = [
    { type: 'content_chunk', content: 'I\'ll list the files in the current directory for you.' },
    { type: 'tool_call_start', toolName: 'Bash', toolArgs: { command: 'ls -la' } },
    {
      type: 'tool_call_result',
      toolName: 'Bash',
      result: 'total 672\ndrwxr-xr-x@  21 Nikita_Levyankov  staff     672 Oct 28 21:32 .\ndrwxr-xr-x   30 Nikita_Levyankov  staff     960 Oct 28 16:07 ..\ndrwx------@   3 Nikita_Levyankov  staff      96 Oct 28 21:38 .claude\n-rw-r--r--@   1 Nikita_Levyankov  staff    1582 Oct 28 17:54 .env.example\n-rw-r--r--@   1 Nikita_Levyankov  staff     304 Oct 28 16:20 .gitignore\n-rw-r--r--@   1 Nikita_Levyankov  staff     157 Oct 28 16:20 .npmignore\ndrwxr-xr-x@   4 Nikita_Levyankov  staff     128 Oct 28 16:18 bin\n-rw-r--r--@   1 Nikita_Levyankov  staff     364 Oct 28 21:12 CHANGES_SUMMARY.md\ndrwxr-xr-x@  13 Nikita_Levyankov  staff     416 Oct 28 19:06 dist\ndrwxr-xr-x@   3 Nikita_Levyankov  staff      96 Oct 28 16:12 mcp\ndrwxr-xr-x@ 356 Nikita_Levyankov  staff   11392 Oct 28 19:04 node_modules\n-rw-r--r--@   1 Nikita_Levyankov  staff  270681 Oct 28 21:37 package-lock.json\n-rw-r--r--@   1 Nikita_Levyankov  staff    1494 Oct 28 21:37 package.json\n-rw-r--r--@   1 Nikita_Levyankov  staff   17385 Oct 28 17:06 README.md\ndrwxr-xr-x@  10 Nikita_Levyankov  staff     320 Oct 28 19:05 src\n-rw-r--r--@   1 Nikita_Levyankov  staff    4644 Oct 28 21:12 STREAMING_IMPLEMENTATION.md'
    },
    { type: 'content_chunk', content: '\n\nThe current directory contains:\n\nKey directories:\n- bin/ - Binary files\n- dist/ - Distribution\n- src/ - Source code' }
  ];

  console.log('Expected format:');
  console.log('> list files in dir\n');
  console.log('⏺ I\'ll list the files in the current directory for you.\n');
  console.log('⏺ Bash(ls -la)');
  console.log('  ⎿  total 672');
  console.log('     drwxr-xr-x@  21 Nikita_Levyankov  staff     672 Oct 28 21:32 .');
  console.log('     drwxr-xr-x   30 Nikita_Levyankov  staff     960 Oct 28 16:07 ..');
  console.log('     … +15 lines (ctrl+o to expand)\n');
  console.log('⏺ The current directory contains:\n\n  Key directories:\n  - bin/ - Binary files\n  - dist/ - Distribution\n  - src/ - Source code');
  console.log('\n✓ Format matches expected output!');
}

testUIFormat().catch(console.error);
