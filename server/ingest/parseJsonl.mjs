import fs from 'node:fs';

// Read one .jsonl session file into an array of raw records. Robust to blank
// lines and partially-written trailing lines (skip what won't parse).
export function parseJsonl(file) {
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  const out = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      out.push(JSON.parse(t));
    } catch {
      // ignore unparseable / truncated line
    }
  }
  return out;
}
