const { CodeMieAgent } = require('../dist/code/agent.js');
const { loadConfig } = require('../dist/code/config.js');
const { FilesystemTools } = require('../dist/code/tools/filesystem.js');

async function test() {
  console.log('=== Streaming Tool Calling Test ===\n');
  
  try {
    const config = loadConfig(process.cwd());
    console.log(`Model: ${config.model}\n`);
    
    const filesystemTools = new FilesystemTools({
      allowedDirectories: [process.cwd()]
    });
    const tools = filesystemTools.getTools();
    console.log(`Loaded ${tools.length} tools\n`);
    
    const agent = new CodeMieAgent(config, tools);
    
    console.log('Query: "list files in this directory"');
    console.log('-------------------------------------------\n');
    
    await agent.chatStream('list files in this directory', (event) => {
      switch(event.type) {
        case 'thinking_start':
          console.log('[Thinking...]');
          break;
        case 'thinking_end':
          console.log('[Thinking complete]');
          break;
        case 'content_chunk':
          process.stdout.write(event.content);
          break;
        case 'tool_call_start':
          console.log(`\n[Tool Call] ${event.toolName}`);
          console.log('Args:', JSON.stringify(event.toolArgs, null, 2));
          break;
        case 'tool_call_result':
          console.log(`[Tool Result] ${event.toolName}`);
          console.log('Result:', event.result.substring(0, 200) + '...');
          break;
        case 'tool_call_error':
          console.log(`[Tool Error] ${event.toolName}: ${event.error}`);
          break;
        case 'complete':
          console.log('\n\n[Complete]');
          break;
        case 'error':
          console.log(`\n[Error] ${event.error}`);
          break;
      }
    });
    
    console.log('\n=== Test Complete ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setTimeout(() => {
  console.error('\n⏱️ Timed out');
  process.exit(1);
}, 60000);

test();
