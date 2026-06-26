// Generates a richer, multi-day sandbox dataset (sandbox-demo/) so the Log
// screen's weekly view has enough sessions/branches/interrupts to look real.
//
// Unlike a purely randomized filler dataset, each branch here is written as a
// short multi-day story: the chapters below are sequential (chapter N+1
// assumes chapter N already landed), tool inputs/outputs are concrete and
// branch-specific (real file paths, real-looking diffs and command output),
// and several sessions carry mid-session follow-up replies or interrupts
// that read as an actual back-and-forth rather than one prompt + a tool loop.
//
// Deterministic (seeded RNG) so re-running reproduces the same files.
// Usage: node sandbox-demo/generate.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PROJECTS = {
  acme: { dir: '-home-dev-acme-web', cwd: '/home/dev/acme-web' },
  billing: { dir: '-home-dev-billing-api', cwd: '/home/dev/billing-api' },
  // The cckado repo itself, used once below for a "today" session that
  // mirrors this very dashboard-generator work (summarized, no transcript
  // dump / no uploaded-image data).
  cckado: { dir: '-home-user-cckado', cwd: '/home/user/cckado' },
};
for (const p of Object.values(PROJECTS)) fs.mkdirSync(path.join(ROOT, '.claude', 'projects', p.dir), { recursive: true });

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

// `weight` scales tool-active/idle time so heavier branches run a bit longer.
const WEIGHT = {
  'exp/agent-flow': 1.5,
  'feat/types': 1.15,
  'fix/auth': 1.05,
  'review/338': 0.85,
  'review/341': 1.1,
  'feat/streaming': 0.9,
  'feat/migration': 1.1,
  'fix/md-bug': 0.8,
};

// step kinds: tool (assistant tool_use -> user tool_result), user (a plain
// follow-up reply with no tool, doesn't disturb the active-span math since it
// always lands strictly after the preceding tool_result), interrupt (a
// queue-operation/remove, counted as 中断 in the dashboard).
const t = (name, input, result) => ({ k: 'tool', name, input, result });
const u = (text) => ({ k: 'user', text });
const x = (text) => ({ k: 'interrupt', text });

const CHAPTERS = {
  'exp/agent-flow': [
    {
      intro: 'サブエージェントのフロー設計を試したい。まずTaskツールの並列実行がどこまで安全か調べて',
      steps: [
        t('Read', { file_path: 'src/agents/orchestrator.ts' }, '120 lines. runTask() がキュー無しで直接 Promise.all している。'),
        t('Task', { description: '並列実行時の競合調査', prompt: 'orchestrator.ts の runTask が同一ファイルへの並列 Write を許しているか確認して' },
          '同一 file_path への並列 Write 検知ロックは無し。競合の再現コードを書いて確認しました。'),
        t('Task', { description: '既存テストの網羅確認', prompt: 'orchestrator の既存テストが並列ケースをカバーしているか確認' },
          'tests/orchestrator.test.ts は逐次実行のみ。並列ケースのテストは存在しません。'),
        u('じゃあ最初にロックの仕組みを入れてから並列数を増やす方向で進めて'),
        t('Bash', { command: 'npm run test -- orchestrator' }, '✓ 8 passed (orchestrator.test.ts) — 並列ケース未カバー'),
      ],
    },
    {
      intro: '昨日の調査どおりファイルロックを入れて、マージ処理を実装して',
      steps: [
        t('Read', { file_path: 'src/agents/orchestrator.ts' }, '前回のまま。runTask() L42 付近に変更ポイント。'),
        t('Edit', { file_path: 'src/agents/orchestrator.ts', old_string: 'await Promise.all(tasks.map(run));', new_string: 'await Promise.all(tasks.map((tsk) => withFileLock(tsk.targetPath, () => run(tsk))));' },
          'Updated src/agents/orchestrator.ts'),
        t('Write', { file_path: 'src/agents/fileLock.ts', content: 'const locks = new Map<string, Promise<void>>();\n\nexport async function withFileLock<T>(path: string, fn: () => Promise<T>): Promise<T> {\n  const prev = locks.get(path) ?? Promise.resolve();\n  let release: () => void;\n  const next = new Promise<void>((r) => (release = r));\n  locks.set(path, prev.then(() => next));\n  await prev;\n  try {\n    return await fn();\n  } finally {\n    release!();\n  }\n}\n' },
          'Created src/agents/fileLock.ts'),
        t('Bash', { command: 'npm run test -- orchestrator' }, '✓ 8 passed, ✓ 1 new (file-lock prevents concurrent write) (orchestrator.test.ts)'),
      ],
    },
    {
      intro: 'ロックが入ったので並列数を3→6に上げてベンチマークを取って',
      steps: [
        t('Read', { file_path: 'src/agents/orchestrator.ts' }, 'MAX_PARALLEL = 3 を確認。'),
        t('Edit', { file_path: 'src/agents/orchestrator.ts', old_string: 'const MAX_PARALLEL = 3;', new_string: 'const MAX_PARALLEL = 6;' }, 'Updated src/agents/orchestrator.ts'),
        t('Write', { file_path: 'bench/orchestrator.bench.mjs', content: "import { runTask } from '../src/agents/orchestrator.ts';\n\nconst start = performance.now();\nawait Promise.all(Array.from({ length: 30 }, () => runTask({ kind: 'noop' })));\nconsole.log(`elapsed: ${(performance.now() - start).toFixed(0)}ms`);\n" },
          'Created bench/orchestrator.bench.mjs'),
        t('Bash', { command: 'node bench/orchestrator.bench.mjs' }, 'elapsed: 4180ms (旧: 3並列で9650ms)'),
        x('ロック待ちで頭打ちになってないか、ロック取得待ち時間も出して'),
        t('Edit', { file_path: 'bench/orchestrator.bench.mjs', old_string: "console.log(`elapsed: ${(performance.now() - start).toFixed(0)}ms`);", new_string: "console.log(`elapsed: ${(performance.now() - start).toFixed(0)}ms, lockWaitTotal: ${lockWaitTotal.toFixed(0)}ms`);" },
          'Updated bench/orchestrator.bench.mjs'),
      ],
    },
    {
      intro: 'ベンチマークの結果どうだった？ロック待ちが原因ならキュー側を見直したい',
      steps: [
        t('Bash', { command: 'node bench/orchestrator.bench.mjs' }, 'elapsed: 4180ms, lockWaitTotal: 2890ms — ロック待ちが7割を占める'),
        t('Read', { file_path: 'src/agents/fileLock.ts' }, '全ロックが同一 Map で直列化されている箇所を確認。'),
        t('Edit', { file_path: 'src/agents/fileLock.ts', old_string: "const locks = new Map<string, Promise<void>>();", new_string: "const locks = new Map<string, Promise<void>>();\n// per-path のロックのみ直列化し、別パスは並列を許す（既存実装でも理論上OKだが\n// targetPath の正規化漏れで衝突キーが揃ってしまっていた）" },
          'Updated src/agents/fileLock.ts'),
        t('Edit', { file_path: 'src/agents/orchestrator.ts', old_string: 'withFileLock(tsk.targetPath, ...', new_string: 'withFileLock(path.resolve(tsk.targetPath), ...' }, 'Updated src/agents/orchestrator.ts'),
        t('Bash', { command: 'node bench/orchestrator.bench.mjs' }, 'elapsed: 1340ms, lockWaitTotal: 110ms'),
        t('Bash', { command: 'npm run test -- orchestrator' }, '✓ 9 passed (orchestrator.test.ts)'),
      ],
    },
    {
      intro: '数値も良くなったし、PR出す前にドキュメントだけ書いて',
      steps: [
        t('Read', { file_path: 'docs/agent-flow.md' }, 'ファイルが存在しない。新規作成が必要。'),
        t('Write', { file_path: 'docs/agent-flow.md', content: '# Sub-agent flow\n\n- MAX_PARALLEL=6 (旧: 3)\n- withFileLock() で targetPath ごとに排他制御\n- ベンチ: 4180ms -> 1340ms (パス正規化のバグ修正後)\n' },
          'Created docs/agent-flow.md'),
        t('Edit', { file_path: 'README.md', old_string: '## React Compiler', new_string: '## Sub-agent flow\n\n詳細は `docs/agent-flow.md` を参照。\n\n## React Compiler' }, 'Updated README.md'),
        t('Bash', { command: 'npm run lint' }, '0 problems'),
      ],
    },
  ],

  'feat/types': [
    {
      intro: 'API レスポンス型を TS に移行したい。まず any がどこに残ってるか洗い出して',
      steps: [
        t('Grep', { pattern: ': any', glob: 'src/**/*.ts' }, 'src/lib/api.ts:14,22,31 / src/lib/session.ts:8 / src/lib/billing.ts:19 — 計5件'),
        t('Read', { file_path: 'src/lib/api.ts' }, 'fetchSession/fetchBilling/fetchUsage が any を返している。'),
        t('Edit', { file_path: 'src/lib/api.ts', old_string: 'export async function fetchSession(id: string): Promise<any> {', new_string: 'export async function fetchSession(id: string): Promise<SessionResponse> {' },
          'Updated src/lib/api.ts'),
      ],
    },
    {
      intro: 'SessionResponse の型をちゃんと定義して、billing 側も合わせて',
      steps: [
        t('Read', { file_path: 'src/types/session.ts' }, 'ファイルなし。'),
        t('Write', { file_path: 'src/types/session.ts', content: 'export interface SessionResponse {\n  id: string;\n  branch: string;\n  startedAt: string;\n  toolCalls: number;\n}\n' }, 'Created src/types/session.ts'),
        t('Write', { file_path: 'src/types/billing.ts', content: 'export interface BillingResponse {\n  plan: \'free\' | \'pro\' | \'enterprise\';\n  seats: number;\n  renewsAt: string;\n}\n' }, 'Created src/types/billing.ts'),
        t('Edit', { file_path: 'src/lib/api.ts', old_string: 'export async function fetchBilling(): Promise<any> {', new_string: 'export async function fetchBilling(): Promise<BillingResponse> {' }, 'Updated src/lib/api.ts'),
      ],
    },
    {
      intro: '型を直したらコンポーネント側でエラー出てると思うので直して',
      steps: [
        t('Bash', { command: 'npm run typecheck' }, "src/components/SessionCard.tsx:18:7 - error TS2339: Property 'toolCalls' does not exist on type 'SessionResponse | undefined'."),
        t('Read', { file_path: 'src/components/SessionCard.tsx' }, 'session が undefined の可能性を考慮していない箇所。'),
        x('Streaming.jsx はまだ型移行しないで、別ブランチでやってるから'),
        t('Edit', { file_path: 'src/components/SessionCard.tsx', old_string: '<span>{session.toolCalls}</span>', new_string: '<span>{session?.toolCalls ?? 0}</span>' }, 'Updated src/components/SessionCard.tsx'),
        t('Bash', { command: 'npm run typecheck' }, '0 errors'),
      ],
    },
    {
      intro: 'テスト通して、レビュー前にlintもかけて',
      steps: [
        t('Bash', { command: 'npm run test' }, '✓ 22 passed, ✓ 3 new (api.test.ts type assertions)'),
        t('Read', { file_path: 'src/lib/api.ts' }, 'fetchUsage がまだ any のまま残っているのを発見。'),
        t('Edit', { file_path: 'src/lib/api.ts', old_string: 'export async function fetchUsage(): Promise<any> {', new_string: 'export async function fetchUsage(): Promise<UsageResponse> {' }, 'Updated src/lib/api.ts'),
        t('Bash', { command: 'npm run lint' }, '0 problems'),
      ],
    },
  ],

  'fix/auth': [
    {
      intro: 'ログイン後しばらくするとトークンのリフレッシュが失敗するって報告があった。再現して調べて',
      steps: [
        t('Read', { file_path: 'src/auth/refresh.ts' }, 'scheduleRefresh() が setTimeout を毎回新規生成、古いタイマーをクリアしていない。'),
        t('Bash', { command: 'npm run dev -- --grep auth/refresh' }, '15分経過後に 401 を確認。複数の refresh タイマーが同時発火している様子。'),
        t('Read', { file_path: 'logs/auth-staging.log' }, '同一ユーザーで refresh が3回連続発火しているログを確認。'),
      ],
    },
    {
      intro: 'タイマーの多重発火が原因っぽいから直して',
      steps: [
        t('Read', { file_path: 'src/auth/refresh.ts' }, 'scheduleRefresh が呼ばれるたびに新規 setTimeout、clearTimeout 漏れを確認。'),
        t('Edit', { file_path: 'src/auth/refresh.ts', old_string: 'export function scheduleRefresh(token: Token) {\n  setTimeout(() => refresh(token), token.expiresInMs - 60_000);\n}', new_string: 'let timer: ReturnType<typeof setTimeout> | null = null;\n\nexport function scheduleRefresh(token: Token) {\n  if (timer) clearTimeout(timer);\n  timer = setTimeout(() => refresh(token), token.expiresInMs - 60_000);\n}' },
          'Updated src/auth/refresh.ts'),
        t('Bash', { command: 'npm run test -- auth' }, '✓ 6 passed, ✓ 1 new (single timer per session) (auth.test.ts)'),
      ],
    },
    {
      intro: 'リフレッシュ自体が失敗した時のリトライも入れて',
      steps: [
        t('Edit', { file_path: 'src/auth/refresh.ts', old_string: 'async function refresh(token: Token) {\n  const res = await api.post(\'/auth/refresh\', { token });\n  applyToken(res);\n}', new_string: 'async function refresh(token: Token, attempt = 0) {\n  try {\n    const res = await api.post(\'/auth/refresh\', { token });\n    applyToken(res);\n  } catch (e) {\n    if (attempt < 2) return refresh(token, attempt + 1);\n    throw e;\n  }\n}' },
          'Updated src/auth/refresh.ts'),
        x('リトライ回数は3回までにして、それ以上はログアウトさせて'),
        t('Edit', { file_path: 'src/auth/refresh.ts', old_string: 'if (attempt < 2) return refresh(token, attempt + 1);\n    throw e;', new_string: 'if (attempt < 3) return refresh(token, attempt + 1);\n    logout();\n    throw e;' }, 'Updated src/auth/refresh.ts'),
        t('Bash', { command: 'npm run test -- auth' }, '✓ 8 passed (auth.test.ts)'),
      ],
    },
    {
      intro: 'staging で一晩置いて再発しないか確認して',
      steps: [
        t('Bash', { command: 'curl -s https://staging.acme.example/api/auth/_debug/timers' }, '{"activeTimers":1,"lastRefreshAt":"2026-06-18T23:58:02Z"}'),
        t('Read', { file_path: 'logs/auth-staging.log' }, '12時間分のログを確認、多重発火なし。401 も発生していない。'),
        t('Bash', { command: 'npm run build' }, 'build success (1.8MB -> 1.81MB)'),
      ],
    },
  ],

  'review/338': [
    {
      intro: 'PR #338（検索のページネーション）のレビュー依頼が来たから見てほしい',
      steps: [
        t('Read', { file_path: 'src/components/SearchResults.jsx' }, '差分: ページネーション state を useState で個別管理、useReducer化が指摘候補。'),
        t('Read', { file_path: 'pr/338/comments.json' }, 'レビューア from @kenji: "state がバラバラなので useReducer にまとめた方が良さそう"'),
        t('Grep', { pattern: 'useState', glob: 'src/components/SearchResults.jsx' }, '4箇所の useState を確認'),
      ],
    },
    {
      intro: 'useReducer 化、お願いできる？',
      steps: [
        t('Edit', { file_path: 'src/components/SearchResults.jsx', old_string: 'const [page, setPage] = useState(1);\nconst [query, setQuery] = useState(\'\');\nconst [sort, setSort] = useState(\'relevance\');\nconst [loading, setLoading] = useState(false);', new_string: 'const [state, dispatch] = useReducer(searchReducer, initialSearchState);' },
          'Updated src/components/SearchResults.jsx'),
        t('Write', { file_path: 'src/components/searchReducer.js', content: "export const initialSearchState = { page: 1, query: '', sort: 'relevance', loading: false };\n\nexport function searchReducer(state, action) {\n  switch (action.type) {\n    case 'SET_PAGE': return { ...state, page: action.page };\n    case 'SET_QUERY': return { ...state, query: action.query, page: 1 };\n    case 'SET_SORT': return { ...state, sort: action.sort };\n    case 'SET_LOADING': return { ...state, loading: action.loading };\n    default: return state;\n  }\n}\n" },
          'Created src/components/searchReducer.js'),
      ],
    },
    {
      intro: 'テストが無いって指摘も来てるから追加して',
      steps: [
        t('Read', { file_path: 'src/components/searchReducer.js' }, 'reducer の挙動を確認、SET_QUERY で page が 1 にリセットされる仕様。'),
        t('Write', { file_path: 'src/components/searchReducer.test.js', content: "import { test } from 'node:test';\nimport assert from 'node:assert';\nimport { searchReducer, initialSearchState } from './searchReducer.js';\n\ntest('SET_QUERY resets page to 1', () => {\n  const s = searchReducer({ ...initialSearchState, page: 3 }, { type: 'SET_QUERY', query: 'foo' });\n  assert.equal(s.page, 1);\n});\n" },
          'Created src/components/searchReducer.test.js'),
        x('そのテストは後で書く、今はビルドが通るかだけ確認して'),
        t('Bash', { command: 'npm run build' }, 'build success'),
      ],
    },
    {
      intro: 'kenjiさんから再レビュー来た、nit対応だけお願い',
      steps: [
        t('Read', { file_path: 'pr/338/comments.json' }, '"action type を文字列リテラルじゃなくて定数にしましょう" の指摘1件'),
        t('Edit', { file_path: 'src/components/searchReducer.js', old_string: "case 'SET_PAGE': return { ...state, page: action.page };", new_string: "case ActionType.SET_PAGE: return { ...state, page: action.page };" }, 'Updated src/components/searchReducer.js (定数 ActionType を追加して置換)'),
      ],
    },
    {
      intro: 'マージ前に最終確認お願い、worktree側で',
      steps: [
        t('Bash', { command: 'npm run lint' }, '0 problems'),
        t('Bash', { command: 'npm run build' }, 'build success'),
        t('Bash', { command: 'git rebase main' }, 'Successfully rebased and updated refs/heads/review/338.'),
      ],
      kind: 'worktree',
    },
  ],

  'review/341': [
    {
      intro: 'PR #341 のレビュー、設計について質問が来てるから対応して',
      steps: [
        t('Read', { file_path: 'pr/341/comments.json' }, '"このエラーは呼び出し元で握ってる想定？" という質問。'),
        t('Grep', { pattern: 'catch (e)', glob: 'src/lib/billing.ts' }, '呼び出し元の3箇所のうち1箇所で catch 漏れを確認'),
        t('Read', { file_path: 'src/lib/billing.ts' }, 'chargeCard() が例外を投げっぱなしで呼び出し元頼みの実装。'),
      ],
      kind: 'remote',
    },
    {
      intro: '握り忘れてる箇所だけ直して、エラーメッセージも分かりやすくして',
      steps: [
        t('Edit', { file_path: 'src/lib/billing.ts', old_string: 'export async function chargeCard(amount: number) {\n  return api.post(\'/billing/charge\', { amount });\n}', new_string: 'export async function chargeCard(amount: number) {\n  try {\n    return await api.post(\'/billing/charge\', { amount });\n  } catch (e) {\n    throw new BillingError(`課金処理に失敗しました (amount=${amount})`, { cause: e });\n  }\n}' },
          'Updated src/lib/billing.ts'),
        x('エラーメッセージは日本語に統一して、コード内コメントは英語のままでいい'),
        t('Edit', { file_path: 'src/lib/billing.ts', old_string: "class BillingError extends Error {}", new_string: "// Wraps lower-level billing API failures with a user-facing message.\nclass BillingError extends Error {}" }, 'Updated src/lib/billing.ts'),
        t('Bash', { command: 'npm run test -- billing' }, '✓ 11 passed (billing.test.ts)'),
      ],
    },
    {
      intro: '最終承認もらえそうなので、指摘の残り1件だけ確認して',
      steps: [
        t('Read', { file_path: 'pr/341/comments.json' }, '"BillingError を export してテストから使えるようにして" の指摘'),
        t('Edit', { file_path: 'src/lib/billing.ts', old_string: 'class BillingError extends Error {}', new_string: 'export class BillingError extends Error {}' }, 'Updated src/lib/billing.ts'),
        t('Bash', { command: 'npm run lint' }, '0 problems'),
      ],
    },
  ],

  'feat/streaming': [
    {
      intro: 'ストリーミングレスポンスのUI、まずSSE受信の雛形を作って',
      steps: [
        t('Write', { file_path: 'src/components/Streaming.jsx', content: "import { useEffect, useState } from 'react';\n\nexport function Streaming({ url }) {\n  const [chunks, setChunks] = useState([]);\n  useEffect(() => {\n    const es = new EventSource(url);\n    es.onmessage = (e) => setChunks((c) => [...c, e.data]);\n    return () => es.close();\n  }, [url]);\n  return <div className=\"stream\">{chunks.join('')}</div>;\n}\n" },
          'Created src/components/Streaming.jsx'),
        t('Read', { file_path: 'src/server/router.mjs' }, 'SSE エンドポイント /api/stream はまだ存在しない。'),
        t('Bash', { command: 'npm run dev' }, 'Local: http://127.0.0.1:5173/'),
      ],
    },
    {
      intro: '接続が切れた時に再接続する処理も入れて',
      steps: [
        t('Edit', { file_path: 'src/components/Streaming.jsx', old_string: 'es.onmessage = (e) => setChunks((c) => [...c, e.data]);', new_string: "es.onmessage = (e) => setChunks((c) => [...c, e.data]);\n    es.onerror = () => {\n      es.close();\n      setTimeout(() => setChunks((c) => c), 1500); // trigger effect re-run via key change upstream\n    };" },
          'Updated src/components/Streaming.jsx'),
        t('Edit', { file_path: 'src/components/Streaming.jsx', old_string: 'export function Streaming({ url }) {', new_string: 'export function Streaming({ url, retryKey = 0 }) {' }, 'Updated src/components/Streaming.jsx'),
        t('Bash', { command: 'npm run test -- streaming' }, '✓ 4 passed (Streaming.test.jsx)'),
      ],
    },
    {
      intro: 'ローディング表示が無いの寂しいから足して',
      steps: [
        t('Read', { file_path: 'src/components/Streaming.jsx' }, 'chunks.length === 0 の間の表示が無い。'),
        x('アニメーションは要らない、シンプルなテキストでいい'),
        t('Write', { file_path: 'src/components/Streaming.module.css', content: '.stream { white-space: pre-wrap; }\n.placeholder { color: #888; }\n' }, 'Created src/components/Streaming.module.css'),
        t('Edit', { file_path: 'src/components/Streaming.jsx', old_string: 'return <div className="stream">{chunks.join(\'\')}</div>;', new_string: "return <div className=\"stream\">{chunks.length ? chunks.join('') : <span className=\"placeholder\">応答待ち…</span>}</div>;" },
          'Updated src/components/Streaming.jsx'),
      ],
    },
    {
      intro: 'サーバ側が落ちて切断された時のケースも一応テストしておいて',
      steps: [
        t('Read', { file_path: 'src/components/Streaming.test.jsx' }, '既存テストは正常系のみ。'),
        t('Edit', { file_path: 'src/components/Streaming.test.jsx', old_string: "// TODO: error case", new_string: "test('shows placeholder again after onerror until retryKey changes', () => {\n  // EventSource is mocked in test setup\n});" },
          'Updated src/components/Streaming.test.jsx'),
        t('Bash', { command: 'npm run test -- streaming' }, '✓ 5 passed (Streaming.test.jsx)'),
      ],
    },
  ],

  'feat/migration': [
    {
      intro: 'billing-api 側、課金プランのカラムを追加したいから既存スキーマ確認して',
      cwd: 'billing',
      steps: [
        t('Read', { file_path: 'billing/db/schema.sql' }, 'accounts テーブルに plan 関連カラムが無いことを確認。'),
        t('Grep', { pattern: 'CREATE TABLE accounts', glob: 'billing/db/*.sql' }, '1件: billing/db/schema.sql:12'),
        t('Read', { file_path: 'billing/db/migrations/0041_add_invoices.sql' }, '直近のマイグレーションの形式（バージョン番号 + up/down）を確認。'),
      ],
    },
    {
      intro: 'マイグレーションスクリプト作って。本番に近いデータでドライランも頼みたいから別エージェントに投げて',
      cwd: 'billing',
      sidechain: true,
      steps: [
        t('Write', { file_path: 'billing/db/migrations/0042_add_plan_column.sql', content: "-- up\nALTER TABLE accounts ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';\nCREATE INDEX idx_accounts_plan ON accounts(plan);\n\n-- down\nDROP INDEX idx_accounts_plan;\nALTER TABLE accounts DROP COLUMN plan;\n" },
          'Created billing/db/migrations/0042_add_plan_column.sql'),
        t('Bash', { command: 'npm run migrate -- --dry-run 0042_add_plan_column' }, 'OK: 48,210 rows would be backfilled with plan=free. Estimated lock time: 1.2s.'),
        x('ロールバック手順（down側）もこのまま動くか一回流して確認して'),
        t('Bash', { command: 'npm run migrate -- --dry-run --down 0042_add_plan_column' }, 'OK: down migration valid, no data loss reported.'),
      ],
    },
    {
      intro: '本番適用前の最終チェックお願い',
      cwd: 'billing',
      steps: [
        t('Bash', { command: 'npm run migrate -- --status' }, 'pending: 0042_add_plan_column.sql (applied to staging at 2026-06-19T02:11Z, OK)'),
        t('Read', { file_path: 'billing/db/migrations/0042_add_plan_column.sql' }, '内容に問題なし。'),
        t('Edit', { file_path: 'billing/db/migrations/0042_add_plan_column.sql', old_string: "-- up\nALTER TABLE accounts ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';", new_string: "-- up\n-- NOT NULL + DEFAULT means this is a metadata-only change on Postgres 11+, no table rewrite.\nALTER TABLE accounts ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';" },
          'Updated billing/db/migrations/0042_add_plan_column.sql'),
        t('Bash', { command: 'npm run test -- migrations' }, '✓ 14 passed (migrations.test.mjs)'),
      ],
    },
  ],

  'fix/md-bug': [
    {
      intro: 'チャットのMarkdownでネストしたリストが崩れるって報告があった、再現して',
      steps: [
        t('Read', { file_path: 'src/components/Markdown.jsx' }, 'リスト入れ子のインデント幅をパーサーのデフォルトのまま使っている。'),
        t('Bash', { command: 'npm run dev' }, 'Local: http://127.0.0.1:5173/ (再現用ページで確認)'),
        t('Read', { file_path: 'src/components/Markdown.test.jsx' }, '入れ子リストのテストケースが存在しない。'),
      ],
    },
    {
      intro: '原因わかった？直して',
      steps: [
        t('Edit', { file_path: 'src/components/Markdown.jsx', old_string: "const parser = createParser({ });", new_string: "const parser = createParser({ listIndent: 2 }); // タブ混在時に4スペース換算でずれていた" },
          'Updated src/components/Markdown.jsx'),
        t('Write', { file_path: 'src/components/Markdown.test.jsx', content: "import { test } from 'node:test';\nimport assert from 'node:assert';\nimport { render } from './Markdown.jsx';\n\ntest('nested list keeps correct depth', () => {\n  const html = render('- a\\n  - b\\n    - c\\n');\n  assert.match(html, /<ul><li>a<ul><li>b<ul><li>c/);\n});\n" },
          'Created src/components/Markdown.test.jsx'),
        t('Bash', { command: 'npm run test -- markdown' }, '✓ 5 passed, ✓ 1 new (nested list depth) (Markdown.test.jsx)'),
      ],
    },
  ],
};

// Which branches run on which weekday (0=Mon..4=Fri), in start order. Each
// occurrence consumes the next unused chapter for that branch.
const WEEK = [
  ['exp/agent-flow', 'feat/types', 'fix/auth', 'feat/streaming', 'fix/md-bug', 'review/338'],
  ['exp/agent-flow', 'feat/types', 'fix/auth', 'review/338', 'feat/migration', 'feat/streaming'],
  ['exp/agent-flow', 'feat/types', 'fix/auth', 'review/338', 'review/341', 'fix/md-bug'],
  ['exp/agent-flow', 'feat/types', 'review/338', 'review/341', 'feat/streaming', 'feat/migration'],
  ['exp/agent-flow', 'review/338', 'feat/streaming', 'feat/migration', 'fix/auth', 'review/341'],
];

const DAY0 = new Date(2026, 5, 15); // Mon 2026-06-15 (local time)
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

let sessionSeq = 1;
let totalInterrupts = 0;
const chapterCursor = {};

function buildSession(day, branch, startMin) {
  const idx = chapterCursor[branch] || 0;
  chapterCursor[branch] = idx + 1;
  const chapter = CHAPTERS[branch][idx];
  if (!chapter) throw new Error(`No chapter ${idx} left for ${branch}`);

  const weight = WEIGHT[branch];
  const proj = PROJECTS[chapter.cwd || 'acme'];
  const cwd = chapter.kind === 'worktree' ? `${proj.cwd}/.git/--claude-worktrees-/${branch.replace('/', '-')}` : proj.cwd;
  const sid = `demo${String(sessionSeq).padStart(4, '0')}-0000-4eee-9000-${String(sessionSeq).padStart(12, '0')}`;
  sessionSeq++;

  const base = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, startMin);
  let cursor = 0;
  const lines = [];
  let uuidN = 0;
  const nextUuid = (p) => `${p}-${sid.slice(0, 6)}-${++uuidN}`;
  const ts = (m) => new Date(base.getTime() + m * 60000).toISOString();

  const common = { sessionId: sid, cwd, gitBranch: branch };
  if (chapter.kind === 'remote') common.bridgeSessionId = `cse_remote_${sid.slice(4, 9)}`;
  if (chapter.sidechain) common.isSidechain = true;

  const userUuid = nextUuid('u');
  lines.push({ type: 'user', ...common, slug: branch.replace('/', '-'), timestamp: ts(cursor), uuid: userUuid, parentUuid: null,
    message: { role: 'user', content: chapter.intro } });
  let parentUuid = userUuid;
  cursor += randInt(1, 2);

  for (const step of chapter.steps) {
    if (step.k === 'tool') {
      const aUuid = nextUuid('a');
      lines.push({ type: 'assistant', ...common, timestamp: ts(cursor), uuid: aUuid, parentUuid,
        message: { role: 'assistant', content: [{ type: 'tool_use', id: `tu-${aUuid}`, name: step.name, input: step.input }] } });
      parentUuid = aUuid;

      cursor += Math.max(2, Math.round(randInt(4, 13) * weight));

      const rUuid = nextUuid('u');
      lines.push({ type: 'user', ...common, timestamp: ts(cursor), uuid: rUuid, parentUuid,
        message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: `tu-${aUuid}`, content: step.result }] } });
      parentUuid = rUuid;

      cursor += Math.max(2, Math.round(randInt(3, 9) * weight));
    } else if (step.k === 'user') {
      const uUuid = nextUuid('u');
      lines.push({ type: 'user', ...common, timestamp: ts(cursor), uuid: uUuid, parentUuid,
        message: { role: 'user', content: step.text } });
      parentUuid = uUuid;
      cursor += randInt(1, 2);
    } else if (step.k === 'interrupt') {
      const qUuid = nextUuid('q');
      lines.push({ type: 'queue-operation', ...common, operation: 'remove', timestamp: ts(cursor), uuid: qUuid, parentUuid,
        content: step.text });
      parentUuid = qUuid;
      totalInterrupts++;
      cursor += 1;
    }
  }

  fs.writeFileSync(path.join(ROOT, '.claude', 'projects', proj.dir, `${sid}.jsonl`), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  return cursor;
}

// Spread each day's sessions across the whole 09:00-19:30 workday instead of
// stacking them all in the morning, but in "waves" of ~2 sessions rather than
// evenly solo-spaced: each wave lands in a different part of the day (morning
// / after-lunch / late-afternoon) so the lanes fan out across the chart, while
// the two sessions within a wave still start close together for the
// concurrency peaks the dashboard is supposed to show.
const DAY_START_MIN = 9 * 60;
const DAY_END_MIN = 19 * 60 + 30;
const WAVE_SIZE = 2;

for (let dayIdx = 0; dayIdx < WEEK.length; dayIdx++) {
  const day = addDays(DAY0, dayIdx);
  const branches = WEEK[dayIdx];

  const waveCount = Math.ceil(branches.length / WAVE_SIZE);
  const span = DAY_END_MIN - DAY_START_MIN;
  const waveSlot = span / waveCount;
  for (let i = 0; i < branches.length; i++) {
    const waveIdx = Math.floor(i / WAVE_SIZE);
    const withinWave = i % WAVE_SIZE;
    const waveStart = DAY_START_MIN + waveSlot * waveIdx + randInt(-15, 15);
    const startMin = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - 30, waveStart + withinWave * randInt(10, 35)));
    buildSession(day, branches[i], startMin);
  }
}

// One real "today" session: a summarized version of the actual working
// session that built this generator (this file). Real branch + real
// timestamps, but condensed to the gist of what happened rather than a
// verbatim transcript dump (the real session log carries the uploaded
// screenshot as inline base64 and is 400+ records long - neither belongs in
// a committed mock dataset).
function buildRealSession() {
  const proj = PROJECTS.cckado;
  const common = { sessionId: 'demo0031-0000-4eee-9000-000000000031', cwd: proj.cwd, gitBranch: 'claude/expand-mock-data-json-f3uwjz' };
  const lines = [];
  let uuidN = 0;
  const nextUuid = (p) => `${p}-real31-${++uuidN}`;
  // The real session actually started 2026-06-25T23:42 UTC and ran past
  // midnight, but that split confuses the daily aggregator's day-bucketing
  // (a session can't span two calendar days cleanly there) - so this
  // condensed replay is shifted to sit entirely within "today".
  const startMs = new Date('2026-06-26T09:10:00Z').getTime();
  let elapsedMin = 0;
  const ts = () => new Date(startMs + elapsedMin * 60000).toISOString();

  const steps = [
    u('モックデータのjsonを何とか増やして再現して欲しい。今はデータが少なすぎ'),
    t('Read', { file_path: 'server/ingest/aggregate.mjs' }, '週次集計（AI比率・並列ピーク・中断数）の算出ロジックを確認。'),
    t('Read', { file_path: 'sandbox/.claude.json' }, 'sandbox/ は単体テストで件数を固定されたフィクスチャと判明。'),
    t('Write', { file_path: 'sandbox-demo/generate.mjs', content: '(seeded generator v1: BRANCHES + 汎用TOOL_INPUT)' }, 'Created sandbox-demo/generate.mjs'),
    t('Bash', { command: 'npm run demo:gen && npm test' }, 'Generated 30 sessions / ✓ 44 passed'),
    x('コピーではダメ。ちゃんとやる'),
    t('Edit', { file_path: 'sandbox-demo/generate.mjs', old_string: 'const BRANCHES = { ... plan: [...] }', new_string: 'const CHAPTERS = { ... 各ブランチの複数日ストーリー }' },
      'Updated sandbox-demo/generate.mjs（汎用plan/TOOL_INPUTを廃止し、ブランチごとの実話風チャプターに置き換え）'),
    t('Bash', { command: 'node sandbox-demo/generate.mjs && npm test' }, 'Generated 30 sessions, interrupts: 7 / ✓ 44 passed'),
    u('なんでこんなに早い時間に偏ってるの？もっと散らして'),
    t('Edit', { file_path: 'sandbox-demo/generate.mjs', old_string: 'startMin += randInt(15, 55);', new_string: 'wave-based scheduling across 09:00-19:30' },
      'Updated sandbox-demo/generate.mjs（開始時刻を午前に固めず、波状に終日へ分散）'),
    t('Bash', { command: 'node sandbox-demo/generate.mjs && npm test' }, 'Generated 30 sessions / ✓ 44 passed'),
    t('Bash', { command: 'git push origin claude/expand-mock-data-json-f3uwjz' }, 'pushed'),
  ];

  const userUuid = nextUuid('u');
  lines.push({ type: 'user', ...common, slug: 'expand-mock-data-json', timestamp: ts(), uuid: userUuid, parentUuid: null,
    message: { role: 'user', content: steps[0].text } });
  let parentUuid = userUuid;
  elapsedMin += 1;

  for (const step of steps.slice(1)) {
    if (step.k === 'tool') {
      const aUuid = nextUuid('a');
      lines.push({ type: 'assistant', ...common, timestamp: ts(), uuid: aUuid, parentUuid,
        message: { role: 'assistant', content: [{ type: 'tool_use', id: `tu-${aUuid}`, name: step.name, input: step.input }] } });
      parentUuid = aUuid;
      elapsedMin += randInt(3, 9);
      const rUuid = nextUuid('u');
      lines.push({ type: 'user', ...common, timestamp: ts(), uuid: rUuid, parentUuid,
        message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: `tu-${aUuid}`, content: step.result }] } });
      parentUuid = rUuid;
      elapsedMin += randInt(1, 4);
    } else if (step.k === 'user') {
      const uUuid = nextUuid('u');
      lines.push({ type: 'user', ...common, timestamp: ts(), uuid: uUuid, parentUuid,
        message: { role: 'user', content: step.text } });
      parentUuid = uUuid;
      elapsedMin += 1;
    } else if (step.k === 'interrupt') {
      const qUuid = nextUuid('q');
      lines.push({ type: 'queue-operation', ...common, operation: 'remove', timestamp: ts(), uuid: qUuid, parentUuid, content: step.text });
      parentUuid = qUuid;
      totalInterrupts++;
      elapsedMin += 1;
    }
  }

  fs.writeFileSync(path.join(ROOT, '.claude', 'projects', proj.dir, `${common.sessionId}.jsonl`), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
  sessionSeq++;
}
buildRealSession();

console.log(`Generated ${sessionSeq - 1} sessions`);
console.log(`Total interrupts emitted: ${totalInterrupts}`);
