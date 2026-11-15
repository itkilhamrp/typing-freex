export function prepareCustomText(rawText: string): string {
  // Preserve explicit newlines, normalize non-newline whitespace per line
  return rawText
    .split('\n')
    .map((line) => line.trim().replace(/[^\S\r\n]+/g, ' '))
    .filter((line, i, arr) => {
      // Remove consecutive empty lines (keep at most 1)
      if (line === '' && i > 0 && arr[i - 1] === '') return false;
      return true;
    })
    .join('\n')
    .trim();
}
