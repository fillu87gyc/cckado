import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSession } from './normalize.mjs';

const T = (hhmm) => `2026-06-25T${hhmm}:00.000Z`;

test('extracts session meta from the first record carrying each field', () => {
  const recs = [
    { type: 'user', sessionId: 'S1', cwd: '/proj', gitBranch: 'main', slug: 'my-slug', timestamp: T('09:00'), uuid: 'u1', parentUuid: null, message: { content: 'hi' } },
  ];
  const s = normalizeSession(recs);
  assert.equal(s.sessionId, 'S1');
  assert.equal(s.cwd, '/proj');
  assert.equal(s.gitBranch, 'main');
  assert.equal(s.slug, 'my-slug');
});

test('returns null meta and zero counts for an empty session', () => {
  const s = normalizeSession([]);
  assert.equal(s.sessionId, null);
  assert.equal(s.cwd, null);
  assert.equal(s.firstTs, null);
  assert.equal(s.lastTs, null);
  assert.equal(s.userMsgs, 0);
  assert.equal(s.assistantMsgs, 0);
  assert.deepEqual(s.toolUses, []);
  assert.equal(s.title, null);
});

test('orders events by timestamp regardless of input order', () => {
  const recs = [
    { type: 'assistant', timestamp: T('09:05'), uuid: 'a1', parentUuid: 'u1', message: { content: [] } },
    { type: 'user', timestamp: T('09:00'), uuid: 'u1', parentUuid: null, message: { content: 'first' } },
  ];
  const s = normalizeSession(recs);
  assert.deepEqual(s.events.map((e) => e.uuid), ['u1', 'a1']);
  assert.equal(s.firstTs.toISOString(), T('09:00'));
  assert.equal(s.lastTs.toISOString(), T('09:05'));
});

test('counts user / assistant / auto / queue-remove and collects interrupts', () => {
  const recs = [
    { type: 'user', timestamp: T('09:00'), uuid: 'u1', message: { content: 'go' } },
    { type: 'assistant', timestamp: T('09:01'), uuid: 'a1', message: { content: [] } },
    { type: 'user', permissionMode: 'auto', timestamp: T('09:02'), uuid: 'u2', message: { content: 'auto turn' } },
    { type: 'queue-operation', operation: 'remove', timestamp: T('09:03'), uuid: 'q1', content: 'cancel that' },
    { type: 'queue-operation', operation: 'add', timestamp: T('09:04'), uuid: 'q2', content: 'ignored' },
  ];
  const s = normalizeSession(recs);
  assert.equal(s.userMsgs, 2);
  assert.equal(s.assistantMsgs, 1);
  assert.equal(s.autoUsers, 1);
  assert.equal(s.queueRemoves, 1); // only 'remove', not 'add'
  assert.equal(s.interrupts.length, 1);
  assert.equal(s.interrupts[0].msg, 'cancel that');
});

test('extracts tool_use spans split evenly across the assistant->next gap', () => {
  const recs = [
    {
      type: 'assistant',
      timestamp: T('09:01'),
      uuid: 'a1',
      message: {
        content: [
          { type: 'text', text: 'working' },
          { type: 'tool_use', id: 'tu1', name: 'Write', input: { content: 'x\ny\n' } },
          { type: 'tool_use', id: 'tu2', name: 'Read', input: { file_path: 'a.js' } },
        ],
      },
    },
    { type: 'user', timestamp: T('09:03'), uuid: 'u1', message: { content: [] } },
  ];
  const s = normalizeSession(recs);
  assert.equal(s.toolUses.length, 2);
  const [write, read] = s.toolUses;
  assert.equal(write.name, 'Write');
  assert.equal(write.id, 'tu1');
  // 120s span / 2 tools = 60s each, laid out back to back.
  assert.equal(write.start.toISOString(), T('09:01'));
  assert.equal(write.end.toISOString(), T('09:02'));
  assert.equal(read.start.toISOString(), T('09:02'));
  assert.equal(read.end.toISOString(), T('09:03'));
});

test('computes AI line deltas per editing tool and accumulates aiLines', () => {
  const recs = [
    {
      type: 'assistant',
      timestamp: T('09:01'),
      uuid: 'a1',
      message: {
        content: [
          { type: 'tool_use', id: 't1', name: 'Write', input: { content: 'a\nb\nc\n' } }, // 4 (trailing nl)
          { type: 'tool_use', id: 't2', name: 'Edit', input: { new_string: 'one\ntwo' } }, // 2
          { type: 'tool_use', id: 't3', name: 'MultiEdit', input: { edits: [{ new_string: 'x' }, { new_string: 'y\nz' }] } }, // 1 + 2 = 3
          { type: 'tool_use', id: 't4', name: 'Bash', input: { command: 'ls' } }, // 0 (non-editing)
        ],
      },
    },
    { type: 'user', timestamp: T('09:02'), uuid: 'u1', message: { content: [] } },
  ];
  const s = normalizeSession(recs);
  const byId = Object.fromEntries(s.toolUses.map((t) => [t.id, t.lineDelta]));
  assert.equal(byId.t1, 4);
  assert.equal(byId.t2, 2);
  assert.equal(byId.t3, 3);
  assert.equal(byId.t4, 0);
  assert.equal(s.aiLines, 9);
});

test('title prefers slug, then first text prompt, then sessionId', () => {
  const base = (extra) => [
    { type: 'user', sessionId: 'SID', timestamp: T('09:00'), uuid: 'u1', message: { content: 'do the thing please' }, ...extra },
  ];
  assert.equal(normalizeSession(base({ slug: 'nice-slug' })).title, 'nice-slug');
  assert.equal(normalizeSession(base({})).title, 'do the thing please');
  // no slug, no prompt text -> sessionId
  const noPrompt = [{ type: 'assistant', sessionId: 'SID', timestamp: T('09:00'), uuid: 'a1', message: { content: [] } }];
  assert.equal(normalizeSession(noPrompt).title, 'SID');
});

test('reads the first prompt from array-style message content', () => {
  const recs = [
    { type: 'user', sessionId: 'S', timestamp: T('09:00'), uuid: 'u1', message: { content: [{ type: 'text', text: 'array prompt' }] } },
  ];
  assert.equal(normalizeSession(recs).title, 'array prompt');
});

// ---- kind classification ----
test('kind defaults to parent', () => {
  const s = normalizeSession([
    { type: 'user', cwd: '/proj', timestamp: T('09:00'), uuid: 'u1', message: { content: 'x' } },
  ]);
  assert.equal(s.kind, 'parent');
  assert.equal(s.isSidechain, false);
});

test('kind is remote when bridgeSessionId starts with cse_', () => {
  const s = normalizeSession([
    { type: 'user', bridgeSessionId: 'cse_abc123', cwd: '/proj', timestamp: T('09:00'), uuid: 'u1', message: { content: 'x' } },
  ]);
  assert.equal(s.kind, 'remote');
});

test('kind is sidechain when any record is a sidechain', () => {
  const s = normalizeSession([
    { type: 'user', isSidechain: true, cwd: '/proj', timestamp: T('09:00'), uuid: 'u1', message: { content: 'x' } },
  ]);
  assert.equal(s.kind, 'sidechain');
  assert.equal(s.isSidechain, true);
});

test('kind is worktree when cwd carries the worktree marker', () => {
  const s = normalizeSession([
    { type: 'user', cwd: '/home/dev/acme/.git/--claude-worktrees-/feat-x', timestamp: T('09:00'), uuid: 'u1', message: { content: 'x' } },
  ]);
  assert.equal(s.kind, 'worktree');
});

test('remote wins over sidechain/worktree classification', () => {
  const s = normalizeSession([
    { type: 'user', bridgeSessionId: 'cse_x', isSidechain: true, cwd: '/x/--claude-worktrees-/y', timestamp: T('09:00'), uuid: 'u1', message: { content: 'x' } },
  ]);
  assert.equal(s.kind, 'remote');
});
