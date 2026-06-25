import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { aggregate } from './ingest/aggregate.mjs';
import { readConfig } from './ingest/config.mjs';

// --- arg parsing: --port / --claude-home (PRD §10 `devstyle serve`) ---
const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const port = Number(getArg('--port') || process.env.PORT || 8787);
const claudeHome = getArg('--claude-home');
if (claudeHome) process.env.CLAUDE_HOME = claudeHome;

// In-memory cache: aggregation is cheap but re-reading every request is wasteful.
const cache = new Map();
function getFacts(project, refresh) {
  const key = project || '__all__';
  if (!refresh && cache.has(key)) return cache.get(key);
  const facts = aggregate({ project });
  cache.set(key, facts);
  return facts;
}

const app = new Hono();

// Allow the Vite dev server origin (proxy makes this same-origin in practice,
// but keep CORS open for direct access during development).
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  await next();
});

app.get('/api/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.get('/api/projects', (c) => c.json(readConfig()));

app.get('/api/activity', (c) => {
  const project = c.req.query('project') || undefined;
  const refresh = c.req.query('refresh') === '1';
  try {
    return c.json(getFacts(project, refresh));
  } catch (err) {
    console.error('[activity] aggregate failed:', err);
    return c.json({ error: String(err && err.message ? err.message : err) }, 500);
  }
});

serve({ fetch: app.fetch, hostname: '127.0.0.1', port }, (info) => {
  console.log(`devstyle server on http://127.0.0.1:${info.port}`);
  if (process.env.CLAUDE_HOME) console.log(`CLAUDE_HOME=${process.env.CLAUDE_HOME}`);
});
