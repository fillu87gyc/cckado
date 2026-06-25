// Generates a richer, multi-day sandbox dataset (sandbox-demo/) so the Log
// screen's weekly view has enough sessions/branches/interrupts to look real.
// Deterministic (seeded RNG) so re-running reproduces the same files.
//
// Usage: node sandbox-demo/generate.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PROJ_DIR = path.join(ROOT, '.claude', 'projects', '-home-dev-acme-web');
fs.mkdirSync(PROJ_DIR, { recursive: true });

// mulberry32 PRNG for deterministic output.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260615);
const randInt = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];

// `weight` scales tool-active and idle-wait time so heavier branches (more
// total weekly minutes, per the reference activity log) run a bit longer.
const BRANCHES = {
  'exp/agent-flow': { title: 'サブエージェントのフロー設計を試す', weight: 1.5, plan: ['Read', 'Task', 'Task', 'Read', 'Bash'] },
  'feat/types': { title: 'API レスポンス型を TS に移行', weight: 1.15, plan: ['Grep', 'Read', 'Edit', 'Edit', 'Bash'] },
  'fix/auth': { title: 'ログイントークンのリフレッシュ不具合を修正', weight: 1.05, plan: ['Read', 'Edit', 'Bash', 'Bash'] },
  'review/338': { title: 'PR #338 のレビュー対応', weight: 0.85, plan: ['Read', 'Read', 'Grep', 'Edit'] },
  'review/341': { title: 'PR #341 のレビュー対応', weight: 1.1, plan: ['Read', 'Grep', 'Read', 'Edit', 'Bash'] },
  'feat/streaming': { title: 'ストリーミングレスポンスの UI 実装', weight: 0.9, plan: ['Read', 'Write', 'Edit', 'Bash'] },
  'feat/migration': { title: 'DB スキーマのマイグレーション作業', weight: 1.1, plan: ['Read', 'Edit', 'Bash', 'Bash', 'Edit'] },
  'fix/md-bug': { title: 'Markdown レンダリングの崩れを修正', weight: 0.8, plan: ['Read', 'Edit', 'Bash'] },
};

// Which branches run on which weekday (0=Mon..4=Fri), in start order.
const WEEK = [
  ['exp/agent-flow', 'feat/types', 'fix/auth', 'feat/streaming', 'fix/md-bug', 'review/338'],
  ['exp/agent-flow', 'feat/types', 'fix/auth', 'review/338', 'feat/migration', 'feat/streaming'],
  ['exp/agent-flow', 'feat/types', 'fix/auth', 'review/338', 'review/341', 'fix/md-bug'],
  ['exp/agent-flow', 'feat/types', 'review/338', 'review/341', 'feat/streaming', 'feat/migration'],
  ['exp/agent-flow', 'review/338', 'feat/streaming', 'feat/migration', 'fix/auth', 'review/341'],
];
// Total queue-remove interrupts per day, summing to 17 across the week.
const INTERRUPTS_PER_DAY = [1, 4, 3, 4, 5];

const DAY0 = new Date(2026, 5, 15); // Mon 2026-06-15 (local time)
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const TOOL_INPUT = {
  Read: () => ({ file_path: pick(['src/components/App.jsx', 'src/lib/api.ts', 'src/server/router.mjs', 'src/components/Streaming.jsx', 'docs/migration.md']) }),
  Grep: () => ({ pattern: pick(['TODO', 'useEffect', 'fetchSession', 'export function']), glob: 'src/**/*.{js,jsx,ts}' }),
  Write: () => ({ file_path: 'src/components/Streaming.jsx', content: 'export function Streaming() {\n  return <div className="stream" />;\n}\n' }),
  Edit: () => ({ file_path: 'src/lib/api.ts', old_string: 'any', new_string: 'ApiResponse' }),
  Bash: () => ({ command: pick(['npm run test', 'npm run lint', 'npm run build', 'npm run typecheck']) }),
  Task: () => ({ description: '並列調査タスク', prompt: '関連箇所を探索して報告して' }),
};

let sessionSeq = 1;
let totalInterrupts = 0;

// Builds one session: alternating assistant tool_use -> user tool_result
// pairs (the tool's own active span), separated by an idle "thinking /
// waiting for the next instruction" gap that the aggregator counts as
// human-wait rather than AI-active time.
function buildSession(day, branch, startMin, dayBudget) {
  const cfg = BRANCHES[branch];
  const sid = `demo${String(sessionSeq).padStart(4, '0')}-0000-4eee-9000-${String(sessionSeq).padStart(12, '0')}`;
  sessionSeq++;

  const base = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, startMin);
  let cursor = 0; // minutes elapsed since session start
  const lines = [];
  let uuidN = 0;
  const nextUuid = (p) => `${p}-${sid.slice(0, 6)}-${++uuidN}`;
  const ts = (m) => new Date(base.getTime() + m * 60000).toISOString();

  const userUuid = nextUuid('u');
  lines.push({
    type: 'user',
    sessionId: sid,
    cwd: '/home/dev/acme-web',
    gitBranch: branch,
    slug: branch.replace('/', '-'),
    timestamp: ts(cursor),
    uuid: userUuid,
    parentUuid: null,
    message: { role: 'user', content: cfg.title },
  });
  let parentUuid = userUuid;
  cursor += randInt(1, 3);

  const interruptAt = randInt(1, cfg.plan.length - 1);
  cfg.plan.forEach((toolName, toolIdx) => {
    const aUuid = nextUuid('a');
    lines.push({
      type: 'assistant',
      sessionId: sid,
      cwd: '/home/dev/acme-web',
      gitBranch: branch,
      timestamp: ts(cursor),
      uuid: aUuid,
      parentUuid,
      message: {
        role: 'assistant',
        content: [{ type: 'tool_use', id: `tu-${aUuid}`, name: toolName, input: TOOL_INPUT[toolName]() }],
      },
    });
    parentUuid = aUuid;

    const toolActiveMin = Math.max(2, Math.round(randInt(4, 13) * cfg.weight));
    cursor += toolActiveMin;

    const rUuid = nextUuid('u');
    lines.push({
      type: 'user',
      sessionId: sid,
      cwd: '/home/dev/acme-web',
      gitBranch: branch,
      timestamp: ts(cursor),
      uuid: rUuid,
      parentUuid,
      message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: `tu-${aUuid}`, content: 'ok' }] },
    });
    parentUuid = rUuid;

    if (toolIdx === interruptAt && dayBudget.used < dayBudget.total) {
      const qUuid = nextUuid('q');
      lines.push({
        type: 'queue-operation',
        sessionId: sid,
        operation: 'remove',
        timestamp: ts(cursor + 1),
        uuid: qUuid,
        parentUuid,
        content: pick(['ちょっと方針変更', 'そこは後回しでいい', 'テストを先に書いて', '別案で進めて']),
      });
      parentUuid = qUuid;
      dayBudget.used++;
      totalInterrupts++;
      cursor += 1;
    }

    // Idle gap before the next turn (not part of any tool span -> human-wait).
    if (toolIdx < cfg.plan.length - 1) {
      cursor += Math.max(2, Math.round(randInt(3, 9) * cfg.weight));
    }
  });

  fs.writeFileSync(path.join(PROJ_DIR, `${sid}.jsonl`), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  return cursor;
}

for (let dayIdx = 0; dayIdx < WEEK.length; dayIdx++) {
  const day = addDays(DAY0, dayIdx);
  const branches = WEEK[dayIdx];
  const dayBudget = { total: INTERRUPTS_PER_DAY[dayIdx], used: 0 };

  let startMin = 9 * 60; // 09:00
  for (let i = 0; i < branches.length; i++) {
    // Stagger starts so several sessions overlap mid-day (parallel peak).
    startMin += i === 0 ? 0 : randInt(15, 55);
    if (startMin > 18 * 60) startMin = 18 * 60 - randInt(0, 90);
    buildSession(day, branches[i], startMin, dayBudget);
  }
}

console.log(`Generated ${sessionSeq - 1} sessions under ${PROJ_DIR}`);
console.log(`Total interrupts emitted: ${totalInterrupts}`);
