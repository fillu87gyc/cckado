import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  claudeHome,
  claudeConfigPath,
  projectsDir,
  encodeProjectPath,
  listProjects,
} from './paths.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sandboxHome = path.resolve(here, '../../sandbox/.claude');

// Snapshot + restore the env vars these helpers read, so tests don't leak.
let saved;
test.beforeEach(() => {
  saved = { CLAUDE_HOME: process.env.CLAUDE_HOME, CLAUDE_CONFIG: process.env.CLAUDE_CONFIG };
});
test.afterEach(() => {
  for (const k of ['CLAUDE_HOME', 'CLAUDE_CONFIG']) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

test('encodeProjectPath replaces every non-alphanumeric char with a dash', () => {
  assert.equal(encodeProjectPath('/home/dev/acme-web'), '-home-dev-acme-web');
  assert.equal(encodeProjectPath('a.b_c/d'), 'a-b-c-d');
  assert.equal(encodeProjectPath('Already0Clean'), 'Already0Clean');
});

test('claudeHome falls back to ~/.claude and honors CLAUDE_HOME', () => {
  delete process.env.CLAUDE_HOME;
  assert.equal(claudeHome(), path.join(os.homedir(), '.claude'));
  process.env.CLAUDE_HOME = '/custom/home';
  assert.equal(claudeHome(), '/custom/home');
  assert.equal(projectsDir(), path.join('/custom/home', 'projects'));
});

test('claudeConfigPath falls back to ~/.claude.json and honors CLAUDE_CONFIG', () => {
  delete process.env.CLAUDE_CONFIG;
  assert.equal(claudeConfigPath(), path.join(os.homedir(), '.claude.json'));
  process.env.CLAUDE_CONFIG = '/custom/config.json';
  assert.equal(claudeConfigPath(), '/custom/config.json');
});

test('listProjects returns [] when the projects dir is missing', () => {
  process.env.CLAUDE_HOME = '/no/such/claude/home';
  assert.deepEqual(listProjects(), []);
});

test('listProjects discovers the sandbox project folders and their session files', () => {
  process.env.CLAUDE_HOME = sandboxHome;
  const projects = listProjects();
  const byEncoded = Object.fromEntries(projects.map((p) => [p.encoded, p]));

  assert.ok(byEncoded['-home-dev-acme-web'], 'acme-web folder is listed');
  assert.ok(byEncoded['-home-dev-billing-api'], 'billing-api folder is listed');

  // acme-web has two session files in the sandbox.
  assert.equal(byEncoded['-home-dev-acme-web'].sessionFiles.length, 2);
  for (const p of projects) {
    assert.ok(p.dir.endsWith(p.encoded));
    assert.ok(p.sessionFiles.every((f) => f.endsWith('.jsonl')));
  }
});
