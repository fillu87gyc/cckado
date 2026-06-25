import test from 'node:test';
import assert from 'node:assert/strict';
import {
  engagementScore,
  engagementRow,
  concurrencyCol,
  cellIndex,
} from './classify.mjs';

// Build the minimal session shape engagementScore reads.
function session({
  userMsgs = 0,
  assistantMsgs = 0,
  autoUsers = 0,
  queueRemoves = 0,
  toolUses = [],
  events = [],
} = {}) {
  return { userMsgs, assistantMsgs, autoUsers, queueRemoves, toolUses, events };
}

test('engagementScore is 0 for an empty session', () => {
  assert.equal(engagementScore(session()), 0);
});

test('engagementScore rewards auto-mode turns', () => {
  // all-auto, no interrupts, no tools: 0.5 * (3/3) = 0.5
  const s = session({ userMsgs: 3, assistantMsgs: 3, autoUsers: 3 });
  assert.ok(Math.abs(engagementScore(s) - 0.5) < 1e-9);
});

test('engagementScore penalizes interrupts (queue removes + parent breaks)', () => {
  // 2 users, both auto -> autoRatio 1 -> +0.5
  // queueRemoves 2 over 2 users -> interruptRatio 1 -> -0.3
  const s = session({ userMsgs: 2, assistantMsgs: 1, autoUsers: 2, queueRemoves: 2 });
  assert.ok(Math.abs(engagementScore(s) - 0.2) < 1e-9);
});

test('engagementScore counts parentUuid discontinuities as interrupts', () => {
  // A user turn whose parent isn't the most recent node = one parent break.
  const events = [
    { type: 'user', uuid: 'u1', parentUuid: null },
    { type: 'assistant', uuid: 'a1', parentUuid: 'u1' },
    // parent 'u1' != lastUuid 'a1' -> break
    { type: 'user', uuid: 'u2', parentUuid: 'u1' },
  ];
  const s = session({ userMsgs: 2, assistantMsgs: 1, events });
  // autoRatio 0, interruptRatio = 1 break / 2 users = 0.5 -> -0.15
  assert.ok(Math.abs(engagementScore(s) - -0.15) < 1e-9);
});

test('engagementScore adds a clamped tools-per-turn term', () => {
  // 10 tools over 1 assistant turn -> toolsPerTurn 10, clamped via /5 to 1 -> +0.2
  const s = session({ userMsgs: 1, assistantMsgs: 1, toolUses: new Array(10).fill({}) });
  assert.ok(Math.abs(engagementScore(s) - 0.2) < 1e-9);
});

test('engagementRow thresholds map score -> row', () => {
  assert.equal(engagementRow(0.9), 0); // > 0.6  -> AI主導
  assert.equal(engagementRow(0.61), 0);
  assert.equal(engagementRow(0.6), 1); // boundary is not > 0.6
  assert.equal(engagementRow(0), 1); // 協働
  assert.equal(engagementRow(-0.2), 1); // boundary is not < -0.2
  assert.equal(engagementRow(-0.21), 2); // 自力中心
});

test('concurrencyCol buckets peak overlap', () => {
  assert.equal(concurrencyCol(0), 0);
  assert.equal(concurrencyCol(1), 0); // 単一
  assert.equal(concurrencyCol(2), 1); // 2セッション
  assert.equal(concurrencyCol(3), 2); // 3+
  assert.equal(concurrencyCol(9), 2);
});

test('cellIndex lays out a 3x3 matrix as row*3+col', () => {
  assert.equal(cellIndex(0, 0), 0);
  assert.equal(cellIndex(1, 1), 4);
  assert.equal(cellIndex(2, 2), 8);
  // every (row,col) pair maps to a distinct cell in 0..8
  const seen = new Set();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) seen.add(cellIndex(r, c));
  assert.equal(seen.size, 9);
});
