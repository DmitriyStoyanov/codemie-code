#!/usr/bin/env node

// Test script to verify that conversation flow works with multiple consecutive questions
const { CodeMieCode } = require('../dist/code/index.js');

async function test() {
  console.log('=== Testing Conversation Flow with 3 Consecutive Questions ===\n');

  try {
    console.log('1. Initializing CodeMie Code...');
    const assistant = new CodeMieCode(process.cwd());
    await assistant.initialize({ showTips: false });
    console.log('✓ Initialization complete\n');

    // Question 1
    console.log('2. Question 1: "What is 2+2?"');
    console.log('-------------------------------------------');

    const response1 = await assistant.chat('What is 2+2?');

    console.log('\n=== Response 1 ===');
    console.log(response1);
    console.log('\n✓ Question 1 complete\n');

    // Question 2
    console.log('3. Question 2: "What is the capital of France?"');
    console.log('-------------------------------------------');

    const response2 = await assistant.chat('What is the capital of France?');

    console.log('\n=== Response 2 ===');
    console.log(response2);
    console.log('\n✓ Question 2 complete\n');

    // Question 3
    console.log('4. Question 3: "List the files in the current directory"');
    console.log('-------------------------------------------');

    const response3 = await assistant.chat('List the files in the current directory');

    console.log('\n=== Response 3 ===');
    console.log(response3);
    console.log('\n✓ Question 3 complete\n');

    console.log('=== Verifying Conversation History ===');
    const history = assistant.agent.getHistory();
    console.log(`Total messages in history: ${history.length}`);
    console.log('\nHistory:');
    history.forEach((msg, idx) => {
      const preview = msg.content.substring(0, 50).replace(/\n/g, ' ');
      console.log(`${idx + 1}. [${msg.role}] ${preview}...`);
    });

    // Count user messages - should be exactly 3
    const userMessages = history.filter(m => m.role === 'user');
    if (userMessages.length !== 3) {
      console.error('\n❌ ERROR: Expected 3 user messages in history, got', userMessages.length);
      process.exit(1);
    }

    // Verify all 3 questions are in history
    const questions = [
      'What is 2+2?',
      'What is the capital of France?',
      'List the files in the current directory'
    ];

    for (let i = 0; i < questions.length; i++) {
      if (!userMessages[i] || userMessages[i].content !== questions[i]) {
        console.error(`\n❌ ERROR: Question ${i+1} not found or incorrect in history`);
        console.error(`Expected: "${questions[i]}"`);
        console.error(`Got: "${userMessages[i]?.content || 'missing'}"`);
        process.exit(1);
      }
    }

    console.log('\n✓ All tests passed!');
    console.log('✓ All 3 questions were properly stored in conversation history');
    console.log('✓ Conversation flow is working correctly');
    console.log('\n=== Test Complete ===');

    await assistant.dispose();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
