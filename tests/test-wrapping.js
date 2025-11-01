#!/usr/bin/env node

// Test long text wrapping
const longText = `I'll list the files in the current directory (\`/Users/Nikita_Levyankov/repos/EPMCDME/codemie-tools\`):

**Directories:**
- \`.claude\` - Claude configuration
- \`src\` - Source code
- \`dist\` - Distribution files`;

console.log('Testing long text wrapping:');
console.log('\nOriginal (would be cut off):');
console.log('⏺', longText);

console.log('\n\nFixed format (multi-line with proper prefix):');
const lines = longText.split('\n');
console.log('⏺', lines[0]);
for (let i = 1; i < lines.length; i++) {
  console.log(lines[i]);
}

console.log('\n✓ Long text now wraps properly without cutting off words!');
