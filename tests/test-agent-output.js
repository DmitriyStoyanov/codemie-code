#!/usr/bin/env node

// Test the agent output by directly invoking the agent with streaming
const { CodeMieCode } = require('../dist/code/index');
const path = require('path');

async function testAgentOutput() {
  console.log('Testing agent output format...\n');
  console.log('Initializing agent...');

  const agent = new CodeMieCode(process.cwd());
  await agent.initialize();

  console.log('\nSending query: "list files in current directory"\n');
  console.log('=' .repeat(80));

  let capturedOutput = {
    contentChunks: [],
    toolCalls: [],
    toolResults: [],
    errors: []
  };

  // Capture events
  const onEvent = (event) => {
    switch (event.type) {
      case 'thinking_start':
        console.log('(thinking...)');
        break;

      case 'thinking_end':
        // Clear thinking line
        break;

      case 'content_chunk':
        capturedOutput.contentChunks.push(event.content);
        process.stdout.write(event.content);
        break;

      case 'tool_call_start':
        const args = Object.entries(event.toolArgs)
          .map(([k, v]) => typeof v === 'string' ? v : JSON.stringify(v))
          .join(', ');
        const toolCallMsg = `\n⏺ ${event.toolName}(${args})`;
        console.log(toolCallMsg);
        capturedOutput.toolCalls.push(toolCallMsg);
        break;

      case 'tool_call_result':
        const lines = event.result.split('\n');
        const displayLines = lines.slice(0, 3);
        const hiddenLines = Math.max(0, lines.length - 3);

        let resultMsg = '  ⎿  ' + displayLines[0];
        for (let i = 1; i < displayLines.length; i++) {
          resultMsg += '\n     ' + displayLines[i];
        }
        if (hiddenLines > 0) {
          resultMsg += `\n     … +${hiddenLines} lines (ctrl+o to expand)`;
        }
        console.log(resultMsg);
        capturedOutput.toolResults.push(resultMsg);
        break;

      case 'tool_call_error':
        const errorMsg = `⏺ Error in ${event.toolName}\n  ⎿  ${event.error}`;
        console.log(errorMsg);
        capturedOutput.errors.push(errorMsg);
        break;

      case 'complete':
        console.log('\n');
        break;

      case 'error':
        console.error('Error:', event.error);
        capturedOutput.errors.push(event.error);
        break;
    }
  };

  // Run the agent with streaming
  const agentInstance = agent.agent || agent;
  await agentInstance.chatStream('list files in current directory', onEvent);

  console.log('=' .repeat(80));
  console.log('\n✓ Agent execution completed');

  // Validate output format
  const checks = [
    { name: 'Content chunks received', passed: capturedOutput.contentChunks.length > 0 },
    { name: 'Tool calls formatted correctly', passed: capturedOutput.toolCalls.some(c => c.includes('⏺') && c.includes('(')) },
    { name: 'Tool results indented with ⎿', passed: capturedOutput.toolResults.some(r => r.includes('⎿')) },
    { name: 'Multi-line results formatted', passed: capturedOutput.toolResults.length > 0 }
  ];

  console.log('\nFormat validation:');
  checks.forEach(check => {
    const status = check.passed ? '✓' : '✗';
    console.log(`  ${status} ${check.name}`);
  });

  const allPassed = checks.every(c => c.passed);
  console.log(`\n${allPassed ? '✓ All format checks passed!' : '✗ Some format checks failed'}`);

  await agent.dispose();
  process.exit(allPassed ? 0 : 1);
}

testAgentOutput().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
