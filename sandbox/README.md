# Sandbox サンプルデータ

実際の `~/.claude` ログを使わずに、ダッシュボードとパーサーを動かすためのサンプル一式。
データの形 (`~/.claude.json` と `~/.claude/projects/**/*.jsonl`) を小さく再現している。

## 中身

```
sandbox/
  .claude.json                         # プロジェクト一覧 + macro 指標 (config パーサ用)
  .claude/projects/
    -home-dev-acme-web/                 # 通常 (parent) + remote セッション
    -home-dev-billing-api/              # parent + sidechain セッション
    -home-dev-acme-web--git-...-search/ # worktree セッション
```

含まれるセッションは、パーサーの分類ロジックを一通り踏むように作ってある:

| セッション | kind | 特徴 |
| --- | --- | --- |
| `a1b2…0001` | `parent` | Grep/Read/Write/Edit/Bash/Task、`queue-operation` の中断、`permissionMode: auto` の turn |
| `b2c3…0002` | `remote` | `bridgeSessionId: cse_*`、末尾に途中で切れた行 (パーサーの耐性確認) |
| `c3d4…0003` | `parent` | billing-api のプロファイリング |
| `d4e5…0004` | `sidechain` | `isSidechain: true` の subagent ログ |
| `e5f6…0005` | `worktree` | `cwd` に worktree マーカーを含む |

`.claude.json` の `userID` / `numStartups` / `projects` は意図的にダミー。外部送信されるものは何もない。

## 使い方

`CLAUDE_HOME` と `CLAUDE_CONFIG` をこのサンドボックスに向ければ、自分のログの代わりにこのデータが読まれる。

```sh
# データサーバだけ起動 (http://127.0.0.1:8787)
CLAUDE_HOME="$(pwd)/sandbox/.claude" \
CLAUDE_CONFIG="$(pwd)/sandbox/.claude.json" \
  npm run serve

# フロントも同時に
CLAUDE_HOME="$(pwd)/sandbox/.claude" \
CLAUDE_CONFIG="$(pwd)/sandbox/.claude.json" \
  npm run dev:all
```

`--claude-home` フラグでも指定できる:

```sh
npm run serve -- --claude-home "$(pwd)/sandbox/.claude"
```

API を直接叩いて確認:

```sh
curl 'http://127.0.0.1:8787/api/activity' | jq '.meta'
curl 'http://127.0.0.1:8787/api/projects' | jq
```

このサンドボックスは `server/ingest/*.test.mjs` の単体テストのフィクスチャとしても使われる。
