import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readConfig } from './config.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sandboxConfig = path.resolve(here, '../../sandbox/.claude.json');

let saved;
test.beforeEach(() => {
  saved = process.env.CLAUDE_CONFIG;
});
test.afterEach(() => {
  if (saved === undefined) delete process.env.CLAUDE_CONFIG;
  else process.env.CLAUDE_CONFIG = saved;
});

test('returns { projects: [] } when the config file is missing', () => {
  process.env.CLAUDE_CONFIG = '/no/such/config.json';
  assert.deepEqual(readConfig(), { projects: [] });
});

test('returns { projects: [] } for malformed JSON instead of throwing', () => {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-')), 'broken.json');
  fs.writeFileSync(tmp, '{ not valid json ');
  process.env.CLAUDE_CONFIG = tmp;
  assert.deepEqual(readConfig(), { projects: [] });
});

test('parses the sandbox config into a UI-friendly shape', () => {
  process.env.CLAUDE_CONFIG = sandboxConfig;
  const cfg = readConfig();

  assert.equal(cfg.userId, 'sandbox-user-0001');
  assert.equal(cfg.numStartups, 42);
  assert.equal(cfg.projects.length, 2);

  const web = cfg.projects.find((p) => p.path === '/home/dev/acme-web');
  assert.ok(web);
  assert.equal(web.name, 'acme-web'); // derived from the last path segment
  assert.deepEqual(web.allowedTools, ['Read', 'Edit', 'Write', 'Bash(npm run *)', 'Grep']);
  assert.deepEqual(web.mcpServers.sort(), ['github', 'playwright']); // keys only

  const api = cfg.projects.find((p) => p.path === '/home/dev/billing-api');
  assert.deepEqual(api.mcpServers, []);
});

test('tolerates a config with no projects key', () => {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-')), 'empty.json');
  fs.writeFileSync(tmp, JSON.stringify({ userID: 'u', numStartups: 1 }));
  process.env.CLAUDE_CONFIG = tmp;
  const cfg = readConfig();
  assert.deepEqual(cfg.projects, []);
  assert.equal(cfg.userId, 'u');
});
