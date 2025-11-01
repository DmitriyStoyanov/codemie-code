#!/usr/bin/env node

/**
 * Test Context7 MCP Server Only
 */

import { MCPTools } from '../dist/code/tools/mcp.js';

async function testContext7Only() {
  console.log('Testing Context7 MCP Server only...\n');

  try {
    const mcpTools = new MCPTools(process.cwd());

    console.log('Initializing Context7...');
    await mcpTools.initialize(['context7']);
    console.log('✓ Context7 initialized');

    console.log('\nLoading tools...');
    const tools = await mcpTools.getTools();
    console.log(`✓ Loaded ${tools.length} tools`);

    tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name}`);
    });

    await mcpTools.dispose();
    console.log('\n✓ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testContext7Only();
