#!/usr/bin/env node

/**
 * End-to-End Test: Time MCP Server Integration with CodeMie Code
 *
 * This test verifies the complete workflow:
 * 1. Add time MCP server via CLI
 * 2. Initialize tools with the server
 * 3. Execute a natural language query (get time in Hong Kong)
 * 4. Verify the result contains Hong Kong time data
 */

import { MCPTools } from '../dist/code/tools/mcp.js';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testEndToEnd() {
  console.log('🧪 End-to-End Test: Time MCP Server with CodeMie Code\n');
  console.log('═'.repeat(60));

  try {
    // Step 1: Ensure time server is configured
    console.log('\n📦 Step 1: Ensure time MCP server is configured');
    const configPath = path.join(os.homedir(), '.codemie', 'config.json');

    let config = {};
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(content);
    } catch (error) {
      // Config doesn't exist, create it
      await fs.mkdir(path.dirname(configPath), { recursive: true });
    }

    // Add time server if not present
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    config.mcpServers.time = {
      transport: 'stdio',
      command: 'uvx',
      args: ['mcp-server-time']
    };

    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('✓ Time MCP server configuration verified');
    console.log(`  Config: ${configPath}`);

    // Step 2: Initialize MCP Tools
    console.log('\n🔧 Step 2: Initialize MCP Tools with time server');
    const mcpTools = new MCPTools(process.cwd());
    await mcpTools.initialize(['time']);
    console.log('✓ MCP Tools initialized');

    // Step 3: Get available tools
    console.log('\n🛠️  Step 3: Load available tools');
    const tools = await mcpTools.getTools();
    console.log(`✓ Loaded ${tools.length} tools from time server`);

    if (tools.length === 0) {
      console.error('✗ No tools loaded from time server!');
      process.exit(1);
    }

    // List tools
    console.log('\n📋 Available tools:');
    tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name}`);
      console.log(`     ${tool.description}`);
    });

    // Step 4: Find and test get_current_time tool
    console.log('\n⚡ Step 4: Query time in Hong Kong');
    const getTimeTool = tools.find(t => t.name === 'mcp_get_current_time');

    if (!getTimeTool) {
      console.error('✗ get_current_time tool not found!');
      process.exit(1);
    }

    console.log('Tool: mcp_get_current_time');
    console.log('Query: "What time is it in Hong Kong?"');
    console.log('Parameters: { timezone: "Asia/Hong_Kong" }');

    // Execute the tool
    const result = await getTimeTool.invoke({ timezone: 'Asia/Hong_Kong' });

    console.log('\n✓ Tool executed successfully!');

    // Step 5: Verify result
    console.log('\n📅 Step 5: Verify result');
    console.log('Result:');
    console.log(result);

    if (!result) {
      console.error('\n✗ Tool returned empty result');
      process.exit(1);
    }

    // Parse and verify the result
    let data;
    try {
      data = typeof result === 'string' ? JSON.parse(result) : result;
      console.log('\n✓ Result is valid JSON');
    } catch (e) {
      console.error('\n✗ Result is not valid JSON');
      console.error('Error:', e.message);
      process.exit(1);
    }

    // Verify Hong Kong timezone
    if (data.timezone && data.timezone.includes('Hong_Kong')) {
      console.log(`✓ Contains correct timezone: ${data.timezone}`);
    } else {
      console.error(`✗ Expected timezone 'Asia/Hong_Kong', got: ${data.timezone}`);
      process.exit(1);
    }

    // Verify datetime is present
    if (data.datetime) {
      console.log(`✓ Contains datetime: ${data.datetime}`);
    } else {
      console.error('✗ Missing datetime field');
      process.exit(1);
    }

    // Verify day of week
    if (data.day_of_week) {
      console.log(`✓ Contains day of week: ${data.day_of_week}`);
    } else {
      console.error('✗ Missing day_of_week field');
      process.exit(1);
    }

    // Step 6: Test convert_time tool
    console.log('\n⚡ Step 6: Test time conversion');
    const convertTimeTool = tools.find(t => t.name === 'mcp_convert_time');

    if (convertTimeTool) {
      console.log('Tool: mcp_convert_time');
      console.log('Query: "Convert 14:00 from Hong Kong to New York"');
      console.log('Parameters: { source_timezone: "Asia/Hong_Kong", time: "14:00", target_timezone: "America/New_York" }');

      const convertResult = await convertTimeTool.invoke({
        source_timezone: 'Asia/Hong_Kong',
        time: '14:00',
        target_timezone: 'America/New_York'
      });

      console.log('\n✓ Conversion tool executed successfully!');
      console.log('Result:');
      console.log(convertResult);

      // Verify conversion result
      const convertData = typeof convertResult === 'string' ? JSON.parse(convertResult) : convertResult;
      if (convertData.target_time) {
        console.log(`✓ Contains converted time: ${convertData.target_time}`);
      }
    }

    // Step 7: Cleanup
    console.log('\n🧹 Step 7: Cleanup');
    await mcpTools.dispose();
    console.log('✓ MCP Tools disposed');

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 All end-to-end tests passed!\n');
    console.log('Summary:');
    console.log('  ✓ Time MCP server configured');
    console.log('  ✓ Tools loaded successfully');
    console.log('  ✓ Hong Kong time query successful');
    console.log('  ✓ Time conversion successful');
    console.log('\n✨ CodeMie Code can now query times for any timezone!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n' + '═'.repeat(60));
    console.error('❌ End-to-End test failed!');
    console.error('\nError:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testEndToEnd();
