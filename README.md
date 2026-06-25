# 稼働ログ / Activity Log

Claude Code のローカルログ (`~/.claude.json` と `~/.claude/projects/**/*.jsonl`) を
パースして、開発スタイルを可視化するダッシュボード (PRD: AI Development Style Visualizer)。

## 実行

```sh
npm install
npm run dev:all   # Hono データサーバ (127.0.0.1:8787) + Vite を同時起動
```

- `npm run serve` … データサーバのみ。`--port` / `--claude-home` を指定可。
  別ホームのログを見る場合: `CLAUDE_HOME=/path/to/.claude npm run serve`
- `npm run dev` … フロントのみ (`/api` は `:8787` にプロキシ)。

データは外部送信せず、すべてローカルで処理される。

---

This project was bootstrapped from the React + Vite template (HMR + Oxlint).

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
