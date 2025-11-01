#!/usr/bin/env node

// Test script to verify codemie-code tool calling works
const { CodeMieCode } = require('../dist/code/index.js');

async function test() {
  console.log('=== Testing CodeMie Code Tool Calling ===\n');
  
  try {
    console.log('1. Initializing CodeMie Code...');
    const assistant = new CodeMieCode(process.cwd());
    await assistant.initialize();
    console.log('✓ Initialization complete\n');
    
    console.log('2. Testing: "list files in the current directory"');
    console.log('-------------------------------------------');
    
    const response = await assistant.chat('list files in the current directory');
    
    console.log('\n=== Response ===');
    console.log(response);
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
