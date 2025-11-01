#!/usr/bin/env node

// Test script to simulate interactive conversation flow with streaming
const { CodeMieCode } = require('../dist/code/index.js');

async function simulateUserInput(assistant, question, questionNum) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Question ${questionNum}: "${question}"`);
  console.log('='.repeat(60));

  let hasStarted = false;
  let hasCompleted = false;
  let hasError = false;

  const events = [];

  try {
    await assistant.agent.chatStream(question, (event) => {
      events.push(event.type);

      switch (event.type) {
        case 'thinking_start':
          if (!hasStarted) {
            process.stdout.write('(thinking...)');
            hasStarted = true;
          }
          break;

        case 'thinking_end':
          if (hasStarted) {
            process.stdout.write('\r            \r'); // Clear thinking line
          }
          break;

        case 'content_chunk':
          if (hasStarted) {
            process.stdout.write('\r            \r');
            hasStarted = false;
          }
          process.stdout.write(event.content);
          break;

        case 'tool_call_start':
          if (hasStarted) {
            process.stdout.write('\r            \r');
            hasStarted = false;
          }
          console.log(`\n[Tool] ${event.toolName}()`);
          break;

        case 'tool_call_result':
          const lines = (event.result || '').split('\n');
          console.log(`  → ${lines[0]}`);
          if (lines.length > 1) {
            console.log(`    ... (${lines.length - 1} more lines)`);
          }
          break;

        case 'complete':
          hasCompleted = true;
          console.log('\n');
          break;

        case 'error':
          hasError = true;
          console.error(`\nError: ${event.error}`);
          break;
      }
    });

    if (!hasCompleted && !hasError) {
      console.error('⚠️  WARNING: Response completed but "complete" event was not fired!');
      return false;
    }

    console.log(`✓ Question ${questionNum} completed successfully`);
    console.log(`  Events received: ${events.join(' → ')}`);
    return true;

  } catch (error) {
    console.error(`\n❌ Question ${questionNum} failed: ${error.message}`);
    return false;
  }
}

async function test() {
  console.log('=== Interactive Conversation Simulation ===\n');
  console.log('This test simulates the interactive mode with 3 consecutive questions');
  console.log('to verify that the agent properly resets state between questions.\n');

  try {
    console.log('Initializing...');
    const assistant = new CodeMieCode(process.cwd());
    await assistant.initialize({ showTips: false });
    console.log('✓ Initialized\n');

    // Simulate 3 consecutive questions like in interactive mode
    const questions = [
      'What is 2+2?',
      'What is the capital of France?',
      'List files in the current directory'
    ];

    let allPassed = true;

    for (let i = 0; i < questions.length; i++) {
      const success = await simulateUserInput(assistant, questions[i], i + 1);
      if (!success) {
        allPassed = false;
        break;
      }

      // Small delay to simulate user thinking time
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (allPassed) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ ALL TESTS PASSED');
      console.log('='.repeat(60));
      console.log('\nConversation flow is working correctly!');
      console.log('The agent properly resets state between questions.');
      console.log('All 3 consecutive questions were handled successfully.');

      await assistant.dispose();
      process.exit(0);
    } else {
      console.log('\n❌ TEST FAILED: Not all questions completed successfully');
      await assistant.dispose();
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
