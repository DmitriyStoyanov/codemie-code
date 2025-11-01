#!/usr/bin/env node

/**
 * Quick test script for terminal UI emoji and text selection
 */

const { TerminalUI } = require('../dist/ui/terminal-ui.js');
const { logger } = require('../dist/utils/logger.js');

// Create a test UI instance
const ui = new TerminalUI({
  workingDirectory: process.cwd(),
  model: 'test-model',
  provider: 'test-provider',
  onSubmit: async (message) => {
    // Remove "thinking..." line
    ui.removeLastLine();

    // Simulate a response with emojis
    const testResponse = `Test response received! 🎉\n\nYour message: "${message}"\n\n✅ Emoji support is working!\n⚠️ Warning: This is a test\n❌ Error example\n🚀 Ready to launch\n💡 Tip: Try selecting this text!`;

    ui.showAssistantResponse(testResponse);
  },
  onSlashCommand: async (command, args) => {
    if (command === 'test') {
      return '🎯 Slash command test successful!\n✨ Emojis: 🐛 🔧 📝 🎨 ⚡ 🔥\n📦 Package: codemie-code\n🌟 Status: All systems go!';
    }
    return `Command: ${command}\nArgs: ${args.join(' ')}\n\n✅ Command executed successfully!`;
  },
  onExit: () => {
    logger.info('👋 Exiting test UI...');
    process.exit(0);
  }
});

// Set some test tips with emojis including copy/paste hints
ui.setTips([
  { message: '💡 Tip: Type /test to see more emojis!' },
  { message: '📋 Copy text: Hold Shift while selecting with mouse' },
  { message: '🍎 Copy text on macOS: Hold Option/Alt while selecting with mouse' },
  { message: '📝 Paste text: Use Cmd+V (macOS) or Ctrl+Shift+V (Linux/Windows)' },
  { message: '🖱️ Right-click paste works in most terminal emulators' },
  { message: '✨ Full Unicode support is now enabled!' },
  { message: '🚀 Press Ctrl+C or type "exit" to quit' }
]);

// Welcome message with emojis
ui.appendToContent('');
ui.appendToContent('{cyan-fg}🧪 UI Test Mode - Testing Emoji Support{/cyan-fg}');
ui.appendToContent('');
ui.appendToContent('📋 Test Instructions:');
ui.appendToContent('  1️⃣  Check the input box - it should show "> " at the beginning');
ui.appendToContent('  2️⃣  Type any message (text should be visible in white)');
ui.appendToContent('  3️⃣  Press Enter to see emoji response');
ui.appendToContent('  4️⃣  Type a second message - the "> " should still be there');
ui.appendToContent('  5️⃣  Type /test to see slash command with emojis');
ui.appendToContent('  6️⃣  Try selecting text with Shift+Mouse or Option+Mouse');
ui.appendToContent('  7️⃣  Type "exit" or press Ctrl+C to quit');
ui.appendToContent('');
ui.appendToContent('{green-fg}✅ If you can see emojis and white text with >, all fixes work!{/green-fg}');
ui.appendToContent('{yellow-fg}📝 Check the rotating tips at the bottom for copy/paste hints{/yellow-fg}');
ui.appendToContent('');

logger.success('🎉 Terminal UI test started!');
logger.info('📝 Type a message to test emoji support...');
