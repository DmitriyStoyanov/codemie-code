#!/usr/bin/env node

/**
 * Test MCP Time Server Integration
 *
 * This test verifies that:
 * 1. Time MCP server can be initialized
 * 2. Tools are loaded from the server
 * 3. Tools can be executed successfully
 */

import { MCPTools } from '../dist/code/tools/mcp.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMCPTimeServer() {
  console.log('🧪 Testing MCP Time Server Integration\n');
  console.log('═'.repeat(50));

  try {
    // Initialize MCP tools with time server
    console.log('\n📦 Step 1: Initialize MCP Tools with time server');
    const mcpTools = new MCPTools(process.cwd());
    await mcpTools.initialize(['time']);
    console.log('✓ MCP Tools initialized');

    // Get tools from the server
    console.log('\n🔧 Step 2: Load tools from time server');
    const tools = await mcpTools.getTools();
    console.log(`✓ Loaded ${tools.length} tools from time server`);

    if (tools.length === 0) {
      console.error('✗ No tools loaded from time server!');
      process.exit(1);
    }

    // List all tools
    console.log('\n📋 Available tools:');
    tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name}`);
      console.log(`     Description: ${tool.description}`);
    });

    // Find get_current_time tool
    const getTimeTool = tools.find(t => t.name === 'mcp_get_current_time');
    if (!getTimeTool) {
      console.error('\n✗ get_current_time tool not found!');
      console.log('Available tools:', tools.map(t => t.name));
      process.exit(1);
    }

    console.log('\n⚡ Step 3: Execute get_current_time tool');

    // Call with timezone parameter (required by the tool)
    console.log('Calling: mcp_get_current_time({ timezone: "Europe/Vilnius" })');

    const result = await getTimeTool.invoke({ timezone: 'Europe/Vilnius' });

    console.log('✓ Tool executed successfully!');
    console.log('\n📅 Result:');
    console.log(result);

    // Verify result contains expected data
    if (!result) {
      console.error('\n✗ Tool returned empty result');
      process.exit(1);
    }

    // Try to parse the result to check if it's valid
    try {
      // Result might be JSON string or already parsed
      const data = typeof result === 'string' ? JSON.parse(result) : result;
      console.log('\n✓ Result is valid JSON');

      if (data.datetime) {
        console.log(`✓ Contains datetime: ${data.datetime}`);
      }
      if (data.timezone) {
        console.log(`✓ Contains timezone: ${data.timezone}`);
      }
    } catch (e) {
      // If it's not JSON, that's okay - might be plain text
      console.log('✓ Result is plain text format');
    }

    // Cleanup
    console.log('\n🧹 Step 4: Cleanup');
    await mcpTools.dispose();
    console.log('✓ MCP Tools disposed');

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 All tests passed!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n' + '═'.repeat(50));
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
testMCPTimeServer();
