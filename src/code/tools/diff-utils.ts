import * as diff from 'diff';

export function createUnifiedDiff(
  oldContent: string,
  newContent: string,
  filePath: string
): string {
  const patch = diff.createPatch(
    filePath,
    oldContent,
    newContent,
    'original',
    'modified'
  );

  // Format with code fence
  const numBackticks = Math.max(3, (patch.match(/`+/g) || []).reduce((max, m) => Math.max(max, m.length), 0) + 1);
  const fence = '`'.repeat(numBackticks);

  return `${fence}diff\n${patch}${fence}\n\n`;
}
