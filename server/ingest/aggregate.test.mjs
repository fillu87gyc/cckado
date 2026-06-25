import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregate } from './aggregate.mjs';

// End-to-end smoke test of the ingest pipeline over the committed sandbox data.
// Assertions are kept timezone-independent (day/week bucketing uses local time).
const here = path.dirname(fileURLToPath(import.meta.url));
const sandboxRoot = path.resolve(here, '../../sandbox');

let saved;
test.before(() => {
  saved = { CLAUDE_HOME: process.env.CLAUDE_HOME, CLAUDE_CONFIG: process.env.CLAUDE_CONFIG };
  process.env.CLAUDE_HOME = path.join(sandboxRoot, '.claude');
  process.env.CLAUDE_CONFIG = path.join(sandboxRoot, '.claude.json');
});
test.after(() => {
  for (const k of ['CLAUDE_HOME', 'CLAUDE_CONFIG']) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

test('aggregates all five sandbox sessions', () => {
  const facts = aggregate();
  assert.equal(facts.meta.sessionCount, 5);
  assert.equal(facts.meta.empty, undefined);
});

test('derives the project list from distinct session cwds', () => {
  const paths = aggregate().meta.projects.map((p) => p.path).sort();
  assert.deepEqual(paths, [
    '/home/dev/acme-web',
    '/home/dev/acme-web/.git/--claude-worktrees-/feat-search',
    '/home/dev/billing-api',
  ]);
});

test('compass is a 9-cell histogram covering every session', () => {
  const { compass } = aggregate();
  assert.equal(compass.length, 9);
  assert.equal(compass.reduce((a, b) => a + b, 0), 5);
});

test('produces a 13-week (quarter) window with the expected shape', () => {
  const { weeks } = aggregate();
  assert.equal(weeks.length, 13);
  for (const w of weeks) {
    assert.ok('hr' in w && 'ai' in w && 'peak' in w);
    assert.equal(w.dayCon.length, 7);
    assert.deepEqual(Object.keys(w.tools).sort(), ['bash', 'edit', 'grep', 'read', 'task']);
  }
});

test('filtering by project narrows the session set', () => {
  const facts = aggregate({ project: '/home/dev/billing-api' });
  assert.equal(facts.meta.sessionCount, 2); // parent + sidechain
  assert.equal(facts.meta.project, '/home/dev/billing-api');
});

test('an unknown project yields the empty-facts shape', () => {
  const facts = aggregate({ project: '/not/a/real/project' });
  assert.equal(facts.meta.empty, true);
  assert.deepEqual(facts.parData, [0]);
  // the selector still offers the real projects discovered in the data
  assert.ok(facts.meta.projects.length >= 1);
});

test('quarterStats exposes the six summary cards', () => {
  const labels = aggregate().quarterStats.map((q) => q.label);
  assert.deepEqual(labels, ['総 AI 稼働', '最長集中', '最長中断', '平均並列度', 'Subagent', '中断']);
});
