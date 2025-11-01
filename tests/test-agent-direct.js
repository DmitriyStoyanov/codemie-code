const { CodeMieAgent } = require('../dist/code/agent.js');
const { loadConfig } = require('../dist/code/config.js');
const { FilesystemTools } = require('../dist/code/tools/filesystem.js');

async function test() {
  console.log('=== Direct Agent Tool Calling Test ===\n');
  
  try {
    // Load config
    const config = loadConfig(process.cwd());
    console.log(`Model: ${config.model}`);
    console.log(`Provider: ${config.provider}\n`);
    
    // Create tools
    const filesystemTools = new FilesystemTools({
      allowedDirectories: [process.cwd()]
    });
    const tools = filesystemTools.getTools();
    console.log(`Loaded ${tools.length} tools\n`);
    
    // Create agent
    const agent = new CodeMieAgent(config, tools);
    
    // Test query
    console.log('Query: "list all files in the current directory"');
    console.log('-------------------------------------------\n');
    
    const response = await agent.chat('list all files in the current directory');
    
    console.log('=== Response ===');
    console.log(response);
    console.log('\n=== Test Complete ===');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Set timeout to prevent hanging
setTimeout(() => {
  console.error('\n⏱️ Test timed out after 60 seconds');
  process.exit(1);
}, 60000);

test();
