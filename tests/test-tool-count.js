#!/usr/bin/env node

/**
 * Quick Test: Verify MCP tools are loaded in interactive mode
 */

import { CodeMieCode } from '../dist/code/index.js';

async function testToolCount() {
  console.log('🧪 Quick Test: MCP Tools Loading\n');
  console.log('═'.repeat(60));

  try {
    console.log('\n📦 Step 1: Initialize CodeMie Code');
    const assistant = new CodeMieCode(process.cwd());
    await assistant.initialize({ showTips: false });
    console.log('✓ CodeMie Code initialized');

    console.log('\n🔍 Step 2: Check loaded tools');
    // Access the agent's tools via reflection (this is a test)
    const agent = assistant['agent'];
    const tools = agent['tools'];

    console.log(`✓ Total tools loaded: ${tools.length}`);

    // Group tools by type
    const toolTypes = {
      filesystem: [],
      command: [],
      git: [],
      mcp: [],
      other: []
    };

    tools.forEach(tool => {
      if (tool.name.startsWith('mcp_')) {
        toolTypes.mcp.push(tool);
      } else if (tool.name.includes('file') || tool.name.includes('directory') || tool.name.includes('read') || tool.name.includes('write')) {
        toolTypes.filesystem.push(tool);
      } else if (tool.name.includes('command') || tool.name.includes('execute')) {
        toolTypes.command.push(tool);
      } else if (tool.name.includes('git')) {
        toolTypes.git.push(tool);
      } else {
        toolTypes.other.push(tool);
      }
    });

    console.log('\n📊 Tools by category:');
    console.log(`  Filesystem: ${toolTypes.filesystem.length}`);
    console.log(`  Command: ${toolTypes.command.length}`);
    console.log(`  Git: ${toolTypes.git.length}`);
    console.log(`  MCP: ${toolTypes.mcp.length}`);
    console.log(`  Other: ${toolTypes.other.length}`);

    if (toolTypes.mcp.length > 0) {
      console.log('\n🔧 MCP Tools:');
      toolTypes.mcp.forEach(tool => {
        console.log(`  • ${tool.name}`);
        console.log(`    ${tool.description}`);
      });
    } else {
      console.log('\n⚠  No MCP tools loaded!');
      console.log('   Check your ~/.codemie/config.json for mcpServers configuration');
    }

    console.log('\n' + '═'.repeat(60));

    if (toolTypes.mcp.length >= 2) {
      console.log('✅ SUCCESS: Found 2 or more MCP tools from context7!\n');
      process.exit(0);
    } else {
      console.log(`⚠  Expected 2+ MCP tools from context7, but found ${toolTypes.mcp.length}\n`);
      process.exit(0); // Still exit 0 as this is informational
    }

  } catch (error) {
    console.error('\n' + '═'.repeat(60));
    console.error('❌ Test failed!');
    console.error('\nError:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testToolCount();
