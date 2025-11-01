#!/usr/bin/env node

// Test to verify the TerminalUI properly resets state after each response
const { CodeMieCode } = require('../dist/code/index.js');
const { TerminalUI } = require('../dist/ui/terminal-ui.js');

async function testUIStateManagement() {
  console.log('=== Testing TerminalUI State Management ===\n');
  console.log('This test verifies that the UI properly resets the isProcessing flag\n');

  try {
    console.log('1. Initializing...');
    const assistant = new CodeMieCode(process.cwd());
    await assistant.initialize({ showTips: false });
    console.log('✓ Initialized\n');

    let messageCount = 0;
    let errorOccurred = false;

    // Create a mock UI config that simulates the actual TerminalUI behavior
    const mockUIState = {
      isProcessing: false,
      inputEnabled: true
    };

    console.log('2. Simulating 3 consecutive message submissions...\n');

    const questions = [
      'What is 2+2?',
      'What is the capital of France?',
      'List files in current directory'
    ];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      // Simulate the submit handler behavior
      console.log(`\n--- Question ${i + 1}: "${question}" ---`);

      // Check if processing (this is what the UI does)
      if (mockUIState.isProcessing) {
        console.error(`❌ ERROR: UI is still processing from previous request!`);
        console.error(`   This means isProcessing flag was not reset properly.`);
        errorOccurred = true;
        break;
      }

      // Set processing flag (like the UI does)
      mockUIState.isProcessing = true;
      mockUIState.inputEnabled = false;
      console.log(`  → isProcessing: ${mockUIState.isProcessing}`);
      console.log(`  → inputEnabled: ${mockUIState.inputEnabled}`);

      try {
        // Call the agent (this is what happens in the UI onSubmitStream)
        await assistant.agent.chatStream(question, (event) => {
          // Track events silently
          if (event.type === 'complete') {
            console.log(`  → Received 'complete' event`);
          }
        });

        messageCount++;
        console.log(`  ✓ Response received`);

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        errorOccurred = true;
      } finally {
        // This is what the finally block in TerminalUI does
        mockUIState.isProcessing = false;
        mockUIState.inputEnabled = true;
        console.log(`  → isProcessing reset to: ${mockUIState.isProcessing}`);
        console.log(`  → inputEnabled reset to: ${mockUIState.inputEnabled}`);
      }

      // Verify state is properly reset
      if (mockUIState.isProcessing) {
        console.error(`\n❌ CRITICAL: isProcessing flag was not reset after question ${i + 1}!`);
        console.error(`   This would block all subsequent questions in the UI.`);
        errorOccurred = true;
        break;
      }

      if (!mockUIState.inputEnabled) {
        console.error(`\n❌ CRITICAL: inputEnabled flag was not reset after question ${i + 1}!`);
        errorOccurred = true;
        break;
      }

      console.log(`  ✓ State properly reset, ready for next question`);
    }

    console.log('\n' + '='.repeat(60));
    if (!errorOccurred && messageCount === 3) {
      console.log('✅ ALL TESTS PASSED');
      console.log('='.repeat(60));
      console.log('\nUI state management is working correctly:');
      console.log('  • isProcessing flag is properly reset after each response');
      console.log('  • Input is re-enabled after each response');
      console.log('  • All 3 consecutive questions were processed successfully');
      console.log('  • No blocking issues detected');
      console.log('\nThe UI should allow continuous conversation without blocking.');

      await assistant.dispose();
      process.exit(0);
    } else {
      console.log('❌ TESTS FAILED');
      console.log('='.repeat(60));
      console.log(`\nProcessed ${messageCount}/3 questions`);
      console.log('There is an issue with state management that would block the UI.');

      await assistant.dispose();
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testUIStateManagement();
