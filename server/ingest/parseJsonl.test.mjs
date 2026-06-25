import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseJsonl } from './parseJsonl.mjs';

// Write `text` to a throwaway .jsonl file and return its path. Files land in a
// per-run temp dir so tests never touch the user's real ~/.claude data.
let tmpDir;
function fixture(text) {
  tmpDir ||= fs.mkdtempSync(path.join(os.tmpdir(), 'parsejsonl-'));
  const file = path.join(tmpDir, `f${Math.random().toString(36).slice(2)}.jsonl`);
  fs.writeFileSync(file, text);
  return file;
}

test.after(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('parses one record per non-empty line', () => {
  const recs = parseJsonl(fixture('{"type":"user","a":1}\n{"type":"assistant","a":2}\n'));
  assert.equal(recs.length, 2);
  assert.deepEqual(recs[0], { type: 'user', a: 1 });
  assert.deepEqual(recs[1], { type: 'assistant', a: 2 });
});

test('skips blank and whitespace-only lines', () => {
  const recs = parseJsonl(fixture('\n  \n{"x":1}\n\t\n{"y":2}\n\n'));
  assert.deepEqual(recs, [{ x: 1 }, { y: 2 }]);
});

test('skips a truncated / unparseable trailing line but keeps valid ones', () => {
  const recs = parseJsonl(fixture('{"ok":1}\n{"truncated":'));
  assert.deepEqual(recs, [{ ok: 1 }]);
});

test('skips a garbage line in the middle without dropping the rest', () => {
  const recs = parseJsonl(fixture('{"a":1}\nnot json at all\n{"b":2}\n'));
  assert.deepEqual(recs, [{ a: 1 }, { b: 2 }]);
});

test('tolerates a missing trailing newline', () => {
  const recs = parseJsonl(fixture('{"a":1}\n{"b":2}'));
  assert.deepEqual(recs, [{ a: 1 }, { b: 2 }]);
});

test('returns [] for a non-existent file instead of throwing', () => {
  assert.deepEqual(parseJsonl('/no/such/file/at/all.jsonl'), []);
});

test('returns [] for an empty file', () => {
  assert.deepEqual(parseJsonl(fixture('')), []);
});
