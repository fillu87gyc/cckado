import { useState } from 'react';

// Verbatim port of the prototype's `state` + action methods + renderVals().
// Kept as close to the original structure/order as practical so the
// interdependencies (e.g. "weekBranches computed early so weekDays can
// reference it") are preserved.

export function useActivityLog() {
  const [state, setState] = useState({
    screen: 'index',
    selectedSession: 0,
    selectedType: 5,
    selectedBranch: -1,
    scrubWeek: 12, // 0..12 = W14..W26
    logView: 'day', // 'day' | 'week' | 'month'
    dayOffset: 0, // 0 = today (6/19), -1 = 6/18, etc.
    weekOffset: 0, // 0 = current week (W26), -1 = W25, etc.
    monthOffset: 0, // 0 = current month (6月)
    datePickerOpen: false,
  });

  const patch = (p) => setState((s) => ({ ...s, ...p }));

  const selectSession = (i) => () =>
    patch({ selectedSession: state.selectedSession === i ? -1 : i });
  const selectType = (i) => () => patch({ selectedType: i });
  const setLogView = (v) => () => patch({ logView: v });
  const shiftDay = (d) => () => setState((s) => ({ ...s, dayOffset: s.dayOffset + d }));
  const shiftWeek = (d) => () => setState((s) => ({ ...s, weekOffset: s.weekOffset + d }));
  const shiftMonth = (d) => () => setState((s) => ({ ...s, monthOffset: s.monthOffset + d }));
  const jumpToDay = (off) => () => patch({ logView: 'day', dayOffset: off });
  const toggleDatePicker = () => () => patch({ datePickerOpen: !state.datePickerOpen });
  const deselect = () => () => patch({ selectedSession: -1 });
  const selectBranch = (i) => () =>
    patch({ selectedBranch: state.selectedBranch === i ? -1 : i });
  const deselectBranch = () => () => patch({ selectedBranch: -1 });
  const go = (screen) => () => patch({ screen });

  const onScrubDown = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    const setW = (clientX) => {
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      patch({ scrubWeek: Math.round(ratio * 12) });
    };
    setW(e.clientX);
    const onMove = (ev) => setW(ev.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const vm = renderVals(state, {
    selectSession,
    selectType,
    setLogView,
    shiftDay,
    shiftWeek,
    shiftMonth,
    jumpToDay,
    toggleDatePicker,
    deselect,
    selectBranch,
    deselectBranch,
    go,
    onScrubDown,
    setState: patch,
  });

  return vm;
}

function renderVals(s, actions) {
  const { selectSession, selectType, shiftDay, shiftWeek, shiftMonth, jumpToDay, toggleDatePicker, selectBranch, deselectBranch, go, onScrubDown, setState } = actions;

  const screens = ['index', 'today', 'log', 'compass', 'quarter'];
  const navJp = { index: '序', today: '本日', log: '日誌', compass: '分布', quarter: '四半期推移' };
  const navEn = { index: 'Index', today: 'Today', log: 'Log', compass: 'Compass', quarter: 'Quarter' };
  const navIcon = { index: 'menu_book', today: 'today', log: 'list_alt', compass: 'donut_small', quarter: 'insights' };

  const navItems = screens.map((sc) => {
    const active = s.screen === sc;
    return {
      jp: navJp[sc],
      en: navEn[sc],
      icon: navIcon[sc],
      go: go(sc),
      iconOpacity: active ? 1 : 0.7,
    };
  });

  const tocItems = [
    { num: '01', jp: '本日', en: "Today's Edition", page: 'p.4', lede: '六月十九日、金曜日。AI 比率 67%、並列ピーク 4 件。本日の特異点と所感。', go: go('today') },
    { num: '02', jp: '稼働ログ', en: 'The Logbook', page: 'p.8', lede: 'セッション 5 件の詳細。メインスレッドと subagent の活動を時間帯で並べる。', go: go('log') },
    { num: '03', jp: '作業分布', en: 'Style Map', page: 'p.14', lede: 'AI 委任度 × 並列セッション数の二軸マトリックス。9 型のうちの現在地。', go: go('compass') },
    { num: '04', jp: '四半期推移', en: 'Quarterly Report', page: 'p.20', lede: 'Q2 (4月～6月) の推移。スクラブ・ヒートマップ・型遷移・ツール構成。', go: go('quarter') },
  ];

  const todayStats = [
    { label: '作業時間', value: '6:42', unit: 'h', sub: 'うち AI 4:30 / 手動 2:12' },
    { label: 'セッション', value: '5', unit: '件', sub: 'メインスレッド 5 / subagent 12' },
    { label: '並列ピーク', value: '4', unit: '隻', sub: '13:20 頃、平均 2.3' },
    { label: '中断', value: '6', unit: '件', sub: '09:52 / 10:34 / 11:40 / 13:42 / 14:20 / 16:12' },
  ];

  // -- § 1 AI vs Manual: horizontal split bar + activity breakdown --
  const aiSumAi = 270; // 4h 30m
  const aiSumMn = 132; // 2h 12m
  const aiSumTotal = aiSumAi + aiSumMn;
  const aiPct = Math.round((aiSumAi / aiSumTotal) * 100);
  const mnPct = 100 - aiPct;
  const aiHours = Math.floor(aiSumAi / 60);
  const aiMins = aiSumAi % 60;
  const mnHours = Math.floor(aiSumMn / 60);
  const mnMins = aiSumMn % 60;

  const aiActivities = [
    { label: 'Edit', mins: 96 },
    { label: 'Task', mins: 78 },
    { label: 'Read · Grep', mins: 54 },
    { label: 'Bash', mins: 42 },
  ];
  const mnActivities = [{ label: '(内訳の自動取得なし)', mins: 132 }];
  const fmtMins = (m) => {
    const h = Math.floor(m / 60),
      mm = m % 60;
    return h > 0 ? h + 'h ' + String(mm).padStart(2, '0') + 'm' : mm + 'm';
  };
  const aiActsRich = aiActivities.map((a) => ({
    ...a,
    pctOfSide: ((a.mins / aiSumAi) * 100).toFixed(2) + '%',
    pctOfTotal: ((a.mins / aiSumTotal) * 100).toFixed(2) + '%',
    pctOfSideNum: Math.round((a.mins / aiSumAi) * 100),
    durLabel: fmtMins(a.mins),
  }));
  const mnActsRich = mnActivities.map((a) => ({
    ...a,
    pctOfSide: ((a.mins / aiSumMn) * 100).toFixed(2) + '%',
    pctOfTotal: ((a.mins / aiSumTotal) * 100).toFixed(2) + '%',
    pctOfSideNum: Math.round((a.mins / aiSumMn) * 100),
    durLabel: fmtMins(a.mins),
  }));
  const aiBarWidthPct = ((aiSumAi / aiSumTotal) * 100).toFixed(3) + '%';
  const mnBarWidthPct = ((aiSumMn / aiSumTotal) * 100).toFixed(3) + '%';
  const totalMinAxis = [0, 60, 120, 180, 240, 300, 360, aiSumTotal];
  const minAxisTicks = totalMinAxis.map((m) => ({
    m,
    label: fmtMins(m),
    leftPct: ((m / aiSumTotal) * 100).toFixed(2) + '%',
    isBoundary: m === aiSumAi,
  }));

  // -- § 2 Parallel: discrete step bars with Y guidelines --
  const parData = [1, 1, 2, 2, 2, 3, 3, 2, 3, 4, 3, 2, 2, 2, 1, 1];
  const maxPar = 4;
  const parChartW = 400,
    parChartH = 140;
  const parPadL = 28,
    parPadR = 8,
    parPadT = 14,
    parPadB = 22;
  const parInnerW = parChartW - parPadL - parPadR;
  const parInnerH = parChartH - parPadT - parPadB;
  const parYAxis = [0, 1, 2, 3, 4].map((v) => ({
    v,
    y: (parPadT + (1 - v / maxPar) * parInnerH).toFixed(1),
    strokeWidth: v === 0 ? 1 : v === maxPar ? 0.5 : 0.6,
    stroke: v === 0 ? 'var(--ink)' : 'var(--rule)',
    dasharray: v === 0 ? 'none' : '3 3',
  }));
  const parBarW = parInnerW / parData.length;
  const parBars = parData.map((v, i) => {
    const xL = parPadL + i * parBarW;
    const yT = parPadT + (1 - v / maxPar) * parInnerH;
    const h = (v / maxPar) * parInnerH;
    return {
      x: xL.toFixed(1),
      y: yT.toFixed(1),
      w: (parBarW - 1).toFixed(1),
      h: h.toFixed(1),
      v,
      isPeak: v === maxPar,
      topY: yT.toFixed(1),
      topX1: xL.toFixed(1),
      topX2: (xL + parBarW - 1).toFixed(1),
    };
  });
  const parXAxis = [9, 10, 11, 12, 13, 14, 15, 16, 17].map((h, i) => ({
    x: (parPadL + i * 2 * parBarW).toFixed(1),
    t: String(h).padStart(2, '0'),
  }));
  const parPeakIdx = parData.indexOf(maxPar);
  const parPeakBar = parBars[parPeakIdx];
  const parAvg = (parData.reduce((a, b) => a + b, 0) / parData.length).toFixed(1);
  const parDist = [1, 2, 3, 4].map((level) => {
    const count = parData.filter((v) => v === level).length;
    return { level, count, pct: Math.round((count / parData.length) * 100) };
  });

  const highlights = [
    { time: '10:42', title: '型推論バグの隔壁、突破', kind: '実装 · main session' },
    { time: '13:20', title: '並列 4 件に達す · ピーク', kind: '計測点 · subagent 並列' },
    { time: '15:38', title: 'PR #341 をマージ', kind: 'マージ · merge' },
  ];

  // -- Log: sessions with subagent lanes --
  const dayStart = 9 * 60;
  const dayEnd = 19 * 60;
  const dayMin = dayEnd - dayStart;
  const scaleX = (m) => ((m - dayStart) / dayMin) * 100;
  const fmt = (m) => {
    const hh = Math.floor(m / 60),
      mm = m % 60;
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  };

  const sessions = [
    {
      id: 'S1',
      branch: 'feat/types',
      title: '型推論バグの調査と修正',
      repo: 'app-core/src/infer.ts',
      start: 9 * 60 + 8,
      end: 11 * 60 + 15,
      aiPct: 72,
      tools: 38,
      aiMin: 88,
      planMin: 12,
      waitMin: 27,
      initial: 'app-core で起きている型推論の取りこぼしを調べたい。最小再現と原因の特定まで。',
      main: [
        { kind: 'read', s: 9 * 60 + 8, e: 9 * 60 + 22 },
        { kind: 'edit', s: 9 * 60 + 22, e: 9 * 60 + 45 },
        { kind: 'bash', s: 9 * 60 + 45, e: 9 * 60 + 52 },
        { kind: 'read', s: 9 * 60 + 52, e: 10 * 60 + 18 },
        { kind: 'edit', s: 10 * 60 + 18, e: 10 * 60 + 42 },
        { kind: 'bash', s: 10 * 60 + 42, e: 10 * 60 + 48 },
        { kind: 'edit', s: 10 * 60 + 48, e: 11 * 60 + 15 },
      ],
      subagents: [
        { name: 'grep-1', delegation: 'type generics 利用箇所の網羅探索', tasks: [{ kind: 'grep', s: 9 * 60 + 25, e: 9 * 60 + 38 }] },
        { name: 'task-1', delegation: '最小再現テストの試作', tasks: [{ kind: 'task', s: 10 * 60 + 5, e: 10 * 60 + 30 }] },
      ],
      interrupts: [
        { t: '09:52', msg: '再現条件もう少し絞ってほしい — 関数型のジェネリクスだけ?' },
        { t: '10:34', msg: 'fix は別 PR で。まず再現テストだけ追加して' },
      ],
    },
    {
      id: 'S2',
      branch: 'review/338',
      title: 'PR レビュー #338 と修正コメント',
      repo: 'app-core/PR#338',
      start: 11 * 60 + 22,
      end: 12 * 60 + 8,
      aiPct: 38,
      tools: 14,
      aiMin: 18,
      planMin: 0,
      waitMin: 22,
      pr: { num: 338, status: 'review' },
      initial: 'PR #338 をレビュー。設計とテスト網羅性を確認、修正コメントを下書き。',
      main: [
        { kind: 'read', s: 11 * 60 + 22, e: 11 * 60 + 48 },
        { kind: 'edit', s: 11 * 60 + 48, e: 12 * 60 + 8 },
      ],
      subagents: [],
      interrupts: [{ t: '11:40', msg: 'コメントは個別 review じゃなくまとめて投げて' }],
    },
    {
      id: 'S3',
      branch: 'feat/cache',
      title: 'cache 層のリファクタ — fleet 並列',
      repo: 'app-core/src/cache/*',
      start: 13 * 60 + 5,
      end: 14 * 60 + 50,
      aiPct: 81,
      tools: 47,
      aiMin: 84,
      planMin: 4,
      waitMin: 17,
      initial: 'cache 層を 3 ファイルに分けて、TTL の扱いを統一。並列で進めて。',
      main: [
        { kind: 'read', s: 13 * 60 + 5, e: 13 * 60 + 18 },
        { kind: 'edit', s: 13 * 60 + 18, e: 13 * 60 + 40 },
        { kind: 'bash', s: 13 * 60 + 40, e: 13 * 60 + 45 },
        { kind: 'edit', s: 13 * 60 + 45, e: 14 * 60 + 12 },
        { kind: 'bash', s: 14 * 60 + 12, e: 14 * 60 + 18 },
        { kind: 'edit', s: 14 * 60 + 18, e: 14 * 60 + 50 },
      ],
      subagents: [
        { name: 'task-2', delegation: 'cache/lru.ts への分割実装', tasks: [{ kind: 'task', s: 13 * 60 + 8, e: 13 * 60 + 38 }] },
        { name: 'task-3', delegation: 'cache/ttl.ts で TTL ロジックを統一', tasks: [{ kind: 'task', s: 13 * 60 + 15, e: 13 * 60 + 52 }] },
        { name: 'task-4', delegation: 'cache/index.ts のエクスポート整理', tasks: [{ kind: 'task', s: 13 * 60 + 25, e: 14 * 60 + 8 }] },
      ],
      interrupts: [
        { t: '13:42', msg: 'TTL の default は env から取らせて — hard-code はやめて' },
        { t: '14:20', msg: 'subagent #2 の方針、テストファイル一本化したい' },
      ],
    },
    {
      id: 'S4',
      branch: 'docs/recap',
      title: '設計ノートの整理と次週の計画',
      repo: 'docs/q2-recap.md',
      start: 15 * 60,
      end: 15 * 60 + 32,
      aiPct: 22,
      tools: 6,
      aiMin: 7,
      planMin: 0,
      waitMin: 0,
      initial: '今週の振り返りを docs にまとめる。次週のテーマも 3 行で。',
      main: [{ kind: 'edit', s: 15 * 60, e: 15 * 60 + 32 }],
      subagents: [],
      interrupts: [],
    },
    {
      id: 'S5',
      branch: 'release/cache',
      title: 'PR #341 の最終調整とマージ',
      repo: 'app-core/PR#341',
      start: 15 * 60 + 38,
      end: 16 * 60 + 45,
      aiPct: 64,
      tools: 18,
      aiMin: 43,
      planMin: 0,
      waitMin: 12,
      pr: { num: 341, status: 'merged' },
      initial: 'PR #341 (cache リファクタ) の lint と test を通して merge へ。',
      main: [
        { kind: 'bash', s: 15 * 60 + 38, e: 15 * 60 + 45 },
        { kind: 'edit', s: 15 * 60 + 45, e: 16 * 60 + 10 },
        { kind: 'bash', s: 16 * 60 + 10, e: 16 * 60 + 18 },
        { kind: 'edit', s: 16 * 60 + 18, e: 16 * 60 + 38 },
        { kind: 'bash', s: 16 * 60 + 38, e: 16 * 60 + 45 },
      ],
      subagents: [{ name: 'task-5', delegation: 'lint エラーの一括修正と test 再走', tasks: [{ kind: 'task', s: 15 * 60 + 50, e: 16 * 60 + 15 }] }],
      interrupts: [{ t: '16:12', msg: 'merge は squash じゃなく rebase で' }],
    },
  ];

  // 稼働(=労働)系のツールは freee勤怠の「労働=単色 teal」に倣い、すべて teal の濃淡で表現する。
  // task(並列実装) は最も濃い teal、read→edit→bash→grep と淡くなるランプ。
  const toolColor = (k) =>
    ({
      task: 'var(--vb-bg-10)',
      read: 'var(--ai)',
      edit: 'color-mix(in oklab, var(--ai) 78%, var(--bg))',
      bash: 'color-mix(in oklab, var(--ai) 56%, var(--bg))',
      grep: 'color-mix(in oklab, var(--ai) 40%, var(--bg))',
    }[k] || 'var(--ink-3)');

  const sessionsRich = sessions.map((sess, idx) => {
    const left = scaleX(sess.start);
    const width = scaleX(sess.end) - scaleX(sess.start);
    const dur = sess.end - sess.start;
    const mainBars = sess.main.map((b) => ({
      kind: b.kind,
      leftPct: (((b.s - sess.start) / dur) * 100).toFixed(2) + '%',
      widthPct: (((b.e - b.s) / dur) * 100).toFixed(2) + '%',
      bg: toolColor(b.kind),
    }));
    const mainBarsLocal = sess.main.map((b) => ({
      kind: b.kind,
      leftPct: (((b.s - sess.start) / dur) * 100).toFixed(2) + '%',
      widthPct: (((b.e - b.s) / dur) * 100).toFixed(2) + '%',
      bg: toolColor(b.kind),
    }));
    const localTicks = [];
    const firstHr = Math.ceil(sess.start / 60);
    const lastHr = Math.floor(sess.end / 60);
    for (let h = firstHr; h <= lastHr; h++) {
      const m = h * 60;
      if (m >= sess.start && m <= sess.end) {
        localTicks.push({
          label: String(h).padStart(2, '0') + ':00',
          leftPct: (((m - sess.start) / dur) * 100).toFixed(2) + '%',
        });
      }
    }
    const kindLabelOf = (name) => {
      if (name.startsWith('grep')) return 'grep · 探索';
      if (name.startsWith('task')) return 'task · 並列実装';
      return 'subagent';
    };
    const fmtDur = (m) => (m >= 60 ? Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm' : m + 'm');
    const subRich = sess.subagents.map((sa) => {
      const tasksLocal = sa.tasks.map((t) => ({
        kind: t.kind,
        leftPct: (((t.s - sess.start) / dur) * 100).toFixed(2) + '%',
        widthPct: (((t.e - t.s) / dur) * 100).toFixed(2) + '%',
        bg: toolColor(t.kind),
      }));
      const tasks = sa.tasks.map((t) => ({
        kind: t.kind,
        leftPct: (((t.s - sess.start) / dur) * 100).toFixed(2) + '%',
        widthPct: (((t.e - t.s) / dur) * 100).toFixed(2) + '%',
        bg: toolColor(t.kind),
      }));
      const firstT = sa.tasks[0];
      const lastT = sa.tasks[sa.tasks.length - 1];
      const saMins = sa.tasks.reduce((a, t) => a + (t.e - t.s), 0);
      return {
        name: sa.name,
        kindLabel: kindLabelOf(sa.name),
        tasks,
        tasksLocal,
        range: fmt(firstT.s) + '–' + fmt(lastT.e),
        durLabel: fmtDur(saMins),
      };
    });
    const isSelected = idx === s.selectedSession;
    return {
      ...sess,
      idx,
      leftPct: left.toFixed(2) + '%',
      widthPct: width.toFixed(2) + '%',
      durMin: dur,
      durLabel: Math.floor(dur / 60) + 'h ' + String(dur % 60).padStart(2, '0') + 'm',
      startLabel: fmt(sess.start),
      endLabel: fmt(sess.end),
      mainBars,
      mainBarsLocal,
      localTicks,
      mainCount: sess.main.length,
      subRich,
      interruptCount: sess.interrupts.length,
      hasInterrupts: sess.interrupts.length > 0,
      subCount: sess.subagents.length,
      hasSubagents: sess.subagents.length > 0,
      noSubagents: sess.subagents.length === 0,
      select: selectSession(idx),
      isSelected,
      borderColor: isSelected ? 'var(--accent)' : 'var(--rule)',
      bgColor: isSelected ? 'var(--bg-panel)' : 'transparent',
    };
  });

  const selectedSess = sessionsRich[s.selectedSession] || sessionsRich[0];

  const hourTicks = [];
  for (let h = 9; h <= 19; h++) {
    hourTicks.push({ h, leftPct: scaleX(h * 60).toFixed(2) + '%', label: String(h).padStart(2, '0') + ':00' });
  }
  const dayHourTicks = [9, 11, 13, 15, 17, 19].map((h) => ({
    h,
    leftPct: scaleX(h * 60).toFixed(2) + '%',
    label: String(h).padStart(2, '0'),
  }));

  // -- branchRows --
  const parseTime = (str) => {
    const [hh, mm] = str.split(':').map(Number);
    return hh * 60 + mm;
  };
  const branchRows = sessions.map((sess, idx) => {
    const isSelected = idx === s.selectedBranch;
    const dur = sess.end - sess.start;
    const dayBars = sess.main.map((b) => ({
      kind: b.kind,
      leftPct: scaleX(b.s).toFixed(2) + '%',
      widthPct: (((b.e - b.s) / dayMin) * 100).toFixed(2) + '%',
    }));
    const interruptTicks = sess.interrupts.map((it) => ({
      t: it.t,
      leftPct: scaleX(parseTime(it.t)).toFixed(2) + '%',
    }));
    const left = scaleX(sess.start);
    const width = scaleX(sess.end) - scaleX(sess.start);
    const hasPR = !!sess.pr;
    const prMarkerLeft = hasPR ? scaleX(sess.end).toFixed(2) + '%' : '0';

    const phaseColor = (k) =>
      ({
        explore: 'color-mix(in oklab, var(--ai) 40%, var(--bg-panel))',
        'ai-working': 'var(--ai)',
        'human-wait': 'var(--human)',
        plan: 'var(--vb-s-07)',
      }[k]);
    const phaseLabel = (k) =>
      ({
        explore: 'explore',
        'ai-working': 'AI working',
        'human-wait': 'human wait',
        plan: 'plan mode',
      }[k]);
    const rawPhases = [];
    let prevEnd = sess.start;
    sess.main.forEach((step) => {
      if (step.s > prevEnd + 0.5) {
        rawPhases.push({ kind: 'human-wait', s: prevEnd, e: step.s });
      }
      const k = step.kind === 'read' || step.kind === 'grep' ? 'explore' : 'ai-working';
      rawPhases.push({ kind: k, s: step.s, e: step.e });
      prevEnd = step.e;
    });
    if (prevEnd < sess.end - 0.5) {
      rawPhases.push({ kind: 'human-wait', s: prevEnd, e: sess.end });
    }
    const mainPhases = [];
    rawPhases.forEach((p) => {
      const last = mainPhases[mainPhases.length - 1];
      if (last && last.kind === p.kind && Math.abs(last.e - p.s) < 0.5) {
        last.e = p.e;
      } else {
        mainPhases.push({ ...p });
      }
    });
    const phasesRich = mainPhases.map((p) => ({
      kind: p.kind,
      label: phaseLabel(p.kind),
      bg: phaseColor(p.kind),
      leftPct: (((p.s - sess.start) / dur) * 100).toFixed(2) + '%',
      widthPct: (((p.e - p.s) / dur) * 100).toFixed(2) + '%',
      durMin: p.e - p.s,
    }));
    const phaseTotals = {
      explore: mainPhases.filter((p) => p.kind === 'explore').reduce((a, p) => a + (p.e - p.s), 0),
      'ai-working': mainPhases.filter((p) => p.kind === 'ai-working').reduce((a, p) => a + (p.e - p.s), 0),
      'human-wait': mainPhases.filter((p) => p.kind === 'human-wait').reduce((a, p) => a + (p.e - p.s), 0),
      plan: 0,
    };
    const interruptLocal = sess.interrupts.map((it) => ({
      t: it.t,
      leftPct: (((parseTime(it.t) - sess.start) / dur) * 100).toFixed(2) + '%',
    }));
    const mainLocalTicks = [];
    const firstHr = Math.ceil(sess.start / 60);
    const lastHr = Math.floor(sess.end / 60);
    for (let h = firstHr; h <= lastHr; h++) {
      const m = h * 60;
      if (m >= sess.start && m <= sess.end) {
        mainLocalTicks.push({
          label: String(h).padStart(2, '0') + ':00',
          leftPct: (((m - sess.start) / dur) * 100).toFixed(2) + '%',
        });
      }
    }
    const kindLabelOf = (name) => {
      if (name.startsWith('grep')) return 'grep · 探索';
      if (name.startsWith('task')) return 'task · 並列実装';
      return 'subagent';
    };
    const fmtDur = (m) => (m >= 60 ? Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm' : m + 'm');
    const subRich = sess.subagents.map((sa) => {
      const tasksLocal = sa.tasks.map((t) => ({
        kind: t.kind,
        leftPct: (((t.s - sess.start) / dur) * 100).toFixed(2) + '%',
        widthPct: (((t.e - t.s) / dur) * 100).toFixed(2) + '%',
        bg: toolColor(t.kind),
      }));
      const firstT = sa.tasks[0];
      const lastT = sa.tasks[sa.tasks.length - 1];
      const saMins = sa.tasks.reduce((a, t) => a + (t.e - t.s), 0);
      return {
        name: sa.name,
        kindLabel: kindLabelOf(sa.name),
        delegation: sa.delegation || '',
        tasksLocal,
        range: fmt(firstT.s) + '–' + fmt(lastT.e),
        durLabel: fmtDur(saMins),
      };
    });
    return {
      idx,
      id: sess.id,
      branch: sess.branch || sess.id.toLowerCase(),
      title: sess.title,
      repo: sess.repo,
      tools: sess.tools,
      aiMin: phaseTotals['ai-working'],
      exploreMin: phaseTotals.explore,
      planMin: phaseTotals.plan,
      waitMin: phaseTotals['human-wait'],
      initial: sess.initial,
      interrupts: sess.interrupts,
      interruptCount: sess.interrupts.length,
      hasInterrupts: sess.interrupts.length > 0,
      subCount: sess.subagents.length,
      hasSubagents: sess.subagents.length > 0,
      noSubagents: sess.subagents.length === 0,
      subRich,
      phasesRich,
      interruptLocal,
      mainLocalTicks,
      startLabel: fmt(sess.start),
      endLabel: fmt(sess.end),
      durLabel: Math.floor(dur / 60) + 'h' + String(dur % 60).padStart(2, '0') + 'm',
      leftPct: left.toFixed(2) + '%',
      widthPct: width.toFixed(2) + '%',
      dayBars,
      interruptTicks,
      hasPR,
      prNum: hasPR ? sess.pr.num : '',
      prStatus: hasPR ? sess.pr.status : '',
      prMarkerLeft,
      isSelected,
      rowBg: isSelected ? 'var(--bg-panel)' : 'transparent',
      select: selectBranch(idx),
      deselect: deselectBranch(),
    };
  });
  const totalSessionsLabel = String(sessions.length).padStart(2, '0');

  // -- Day/Week/Month helpers --
  const baseDate = new Date(2026, 5, 19); // 2026-06-19 Fri = "today"
  const addDays = (d, n) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };
  const wdJp = ['日', '月', '火', '水', '木', '金', '土'];
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtDate = (d) => d.getMonth() + 1 + '/' + d.getDate();
  const fmtDateFull = (d) => d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate());
  const fmtISO = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
  const jumpToDate = (isoStr) => {
    const [y, m, d] = isoStr.split('-').map(Number);
    const picked = new Date(y, m - 1, d);
    const off = Math.round((picked.getTime() - baseDate.getTime()) / (24 * 3600 * 1000));
    setState({ dayOffset: Math.min(off, 0), datePickerOpen: false });
  };

  const hashStr = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  };
  const rngFor = (d, k = '') => {
    let h = hashStr(fmtDateFull(d) + '|' + k);
    return () => {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      return h / 0x7fffffff;
    };
  };
  const dayStatsFor = (d) => {
    const r = rngFor(d);
    const we = isWeekend(d);
    const isToday = d.getTime() === baseDate.getTime();
    if (isToday) {
      return { hours: 6.7, mins: 402, aiPct: 67, sessions: 5, subagents: 8, prs: 1, peak: 4, interrupts: 6, tools: 123 };
    }
    const hours = we ? +(r() * 2.0).toFixed(1) : +(3.5 + r() * 4).toFixed(1);
    const sess = we ? Math.floor(r() * 2) : 2 + Math.floor(r() * 5);
    return {
      hours,
      mins: Math.round(hours * 60),
      aiPct: Math.round(45 + r() * 38),
      sessions: sess,
      subagents: sess ? Math.floor(r() * sess * 2.5) : 0,
      prs: r() < 0.55 ? 0 : 1 + Math.floor(r() * 2),
      peak: sess === 0 ? 0 : 1 + Math.floor(r() * Math.min(4, sess + 1)),
      interrupts: sess === 0 ? 0 : Math.floor(r() * 5),
      tools: sess === 0 ? 0 : 20 + Math.floor(r() * 80),
    };
  };
  const daySessionsFor = (d) => {
    const stats = dayStatsFor(d);
    if (stats.sessions === 0) return [];
    const r = rngFor(d, 'sess');
    const out = [];
    let cursor = 9 * 60 + Math.floor(r() * 30);
    for (let i = 0; i < stats.sessions; i++) {
      const dur = 25 + Math.floor(r() * 90);
      const start = cursor;
      const end = Math.min(start + dur, 19 * 60 - 5);
      out.push({ s: start, e: end, ai: r() < stats.aiPct / 100 });
      cursor = end + 10 + Math.floor(r() * 40);
      if (cursor > 18 * 60) break;
    }
    return out;
  };
  const dayInterruptsFor = (d) => {
    const stats = dayStatsFor(d);
    const r = rngFor(d, 'int');
    const out = [];
    for (let i = 0; i < stats.interrupts; i++) {
      const m = 9 * 60 + 30 + Math.floor(r() * (9 * 60));
      out.push(m);
    }
    return out.sort((a, b) => a - b);
  };

  const viewedDate = addDays(baseDate, s.dayOffset);
  const viewedDateStats = dayStatsFor(viewedDate);
  const isToday_ = s.dayOffset === 0;
  const dayLabel = fmtDateFull(viewedDate) + ' (' + wdJp[viewedDate.getDay()] + ')';
  const dayLabelShort = viewedDate.getMonth() + 1 + '月' + viewedDate.getDate() + '日 ' + wdJp[viewedDate.getDay()] + '曜';

  // -- Week view data --
  const weekBase = addDays(baseDate, s.weekOffset * 7);
  const weekStartOffset = (weekBase.getDay() + 6) % 7;
  const weekStart = addDays(weekBase, -weekStartOffset);

  // weekBranches computed early so weekDays can reference it
  const weekBranchPool = [
    'feat/types', 'feat/cache', 'feat/ui-polish', 'feat/streaming',
    'review/338', 'review/341', 'review/355',
    'fix/auth', 'fix/dnd-bug',
    'docs/recap', 'release/cache', 'chore/deps', 'exp/agent-flow', 'test/integration',
  ];
  const weekBranchActivity_ = (weekStartDate) => {
    const r = rngFor(weekStartDate, 'wkbr');
    const nBr = 6 + Math.floor(r() * 3);
    const pool = [...weekBranchPool];
    const branches = [];
    for (let i = 0; i < nBr; i++) {
      if (!pool.length) break;
      const idx = Math.floor(r() * pool.length);
      branches.push({
        name: pool.splice(idx, 1)[0],
        sessions: [],
        aiTendency: 0.4 + r() * 0.5,
        activityRate: 0.45 + r() * 0.45,
      });
    }
    for (let day = 0; day < 7; day++) {
      const d = addDays(weekStartDate, day);
      if (d.getTime() > baseDate.getTime()) continue;
      const we = isWeekend(d);
      branches.forEach((br, brI) => {
        const rB = rngFor(d, 'br' + brI);
        const dayActive = we ? rB() < 0.18 : rB() < br.activityRate;
        if (!dayActive) return;
        const nBlocks = 1 + Math.floor(rB() * (we ? 1.2 : 2.6));
        for (let k = 0; k < nBlocks; k++) {
          const dur = 25 + Math.floor(rB() * 110);
          const latestStart = 19 * 60 - dur;
          const earliestStart = 9 * 60;
          if (latestStart <= earliestStart) continue;
          const ss = earliestStart + Math.floor(rB() * (latestStart - earliestStart));
          const ee = ss + dur;
          br.sessions.push({ day, s: ss, e: ee, ai: rB() < br.aiTendency });
        }
      });
    }
    return branches
      .filter((b) => b.sessions.length > 0)
      .sort((a, b) => b.sessions.reduce((x, ss) => x + (ss.e - ss.s), 0) - a.sessions.reduce((x, ss) => x + (ss.e - ss.s), 0));
  };
  const weekBranches = weekBranchActivity_(weekStart);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const st = dayStatsFor(d);
    const sess = daySessionsFor(d);
    const ints = dayInterruptsFor(d);
    const offFromToday = Math.round((d.getTime() - baseDate.getTime()) / (24 * 3600 * 1000));
    const sessBars = sess.map((b) => ({
      leftPct: (((b.s - 9 * 60) / (10 * 60)) * 100).toFixed(2) + '%',
      widthPct: (((b.e - b.s) / (10 * 60)) * 100).toFixed(2) + '%',
      bg: b.ai ? 'var(--ai)' : 'var(--human)',
    }));
    const intTicks = ints.map((m) => ({ leftPct: (((m - 9 * 60) / (10 * 60)) * 100).toFixed(2) + '%' }));
    const dayLanesRaw = weekBranches
      .map((br) => {
        const onDay = br.sessions.filter((s2) => s2.day === i);
        return { name: br.name, sessions: onDay };
      })
      .filter((l) => l.sessions.length > 0);
    const dayLanes = dayLanesRaw.map((l) => ({
      name: l.name,
      bars: l.sessions.map((b) => ({
        leftPct: (((b.s - 9 * 60) / (10 * 60)) * 100).toFixed(2) + '%',
        widthPct: (((b.e - b.s) / (10 * 60)) * 100).toFixed(2) + '%',
        bg: b.ai ? 'var(--ai)' : 'var(--human)',
      })),
    }));
    let dayConcPeak = 0;
    for (let m = 9 * 60; m < 19 * 60; m += 30) {
      let n = 0;
      dayLanesRaw.forEach((l) => {
        if (l.sessions.some((s2) => s2.s <= m && s2.e > m)) n++;
      });
      if (n > dayConcPeak) dayConcPeak = n;
    }
    const isFuture = d.getTime() > baseDate.getTime();
    return {
      dateNum: d.getDate(),
      wd: wdJp[d.getDay()],
      dateLabel: fmtDate(d),
      ...st,
      sessBars,
      intTicks,
      dayLanes,
      dayConcPeak,
      hasMultiLanes: dayLanes.length > 1,
      isToday: d.getTime() === baseDate.getTime(),
      isFuture,
      weekend: isWeekend(d),
      rowBg: d.getTime() === baseDate.getTime() ? 'color-mix(in oklab, var(--accent) 6%, var(--bg))' : 'transparent',
      labelColor: isFuture ? 'var(--ink-3)' : 'var(--ink)',
      opacity: isFuture ? 0.45 : 1,
      jumpToDay: jumpToDay(offFromToday),
      aiBarWidth: st.aiPct + '%',
    };
  });
  const weekTotals = weekDays.reduce(
    (a, d) => ({
      hours: a.hours + d.hours,
      sessions: a.sessions + d.sessions,
      subagents: a.subagents + d.subagents,
      prs: a.prs + d.prs,
      interrupts: a.interrupts + d.interrupts,
      tools: a.tools + d.tools,
      peak: Math.max(a.peak, d.peak),
      aiMins: a.aiMins + (d.mins * d.aiPct) / 100,
      totalMins: a.totalMins + d.mins,
    }),
    { hours: 0, sessions: 0, subagents: 0, prs: 0, interrupts: 0, tools: 0, peak: 0, aiMins: 0, totalMins: 0 }
  );
  weekTotals.hours = weekTotals.hours.toFixed(1);
  const weekAvgAi = weekTotals.totalMins > 0 ? Math.round((weekTotals.aiMins / weekTotals.totalMins) * 100) : 0;
  const weekEnd = addDays(weekStart, 6);
  const weekRangeLabel = fmtDate(weekStart) + ' → ' + fmtDate(weekEnd);
  const weekNum = 26 + s.weekOffset;
  const weekLabel = 'W' + weekNum;

  const computePeakConcurrent = (branches) => {
    let peak = 0,
      total = 0,
      samples = 0;
    for (let day = 0; day < 7; day++) {
      for (let m = 9 * 60; m < 19 * 60; m += 30) {
        let n = 0;
        branches.forEach((br) => {
          if (br.sessions.some((s2) => s2.day === day && s2.s <= m && s2.e > m)) n++;
        });
        if (n > 0) {
          total += n;
          samples++;
        }
        if (n > peak) peak = n;
      }
    }
    return { peak, avg: samples > 0 ? (total / samples).toFixed(1) : '0.0' };
  };

  const weekConc = computePeakConcurrent(weekBranches);
  const weekTotalMins = 7 * 600;
  const weekBranchesRich = weekBranches.map((br) => {
    const totalMin = br.sessions.reduce((a, s2) => a + (s2.e - s2.s), 0);
    const distinctDays = new Set(br.sessions.map((s2) => s2.day)).size;
    return {
      name: br.name,
      sessionCount: br.sessions.length,
      totalMin,
      durLabel: totalMin >= 60 ? Math.floor(totalMin / 60) + 'h ' + pad2(totalMin % 60) + 'm' : totalMin + 'm',
      distinctDays,
      bars: br.sessions.map((blk) => ({
        leftPct: (((blk.day * 600 + (blk.s - 9 * 60)) / weekTotalMins) * 100).toFixed(3) + '%',
        widthPct: (((blk.e - blk.s) / weekTotalMins) * 100).toFixed(3) + '%',
        bg: blk.ai ? 'var(--ai)' : 'var(--human)',
      })),
    };
  });
  const weekDayCols = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return {
      leftPct: ((i / 7) * 100).toFixed(3) + '%',
      widthPct: (100 / 7).toFixed(3) + '%',
      dateNum: d.getDate(),
      wd: wdJp[d.getDay()],
      weekend: isWeekend(d),
      isToday: d.getTime() === baseDate.getTime(),
      isFuture: d.getTime() > baseDate.getTime(),
      labelColor: d.getTime() === baseDate.getTime() ? 'var(--accent)' : d.getTime() > baseDate.getTime() ? 'var(--ink-3)' : 'var(--ink-2)',
      cellBg: d.getTime() > baseDate.getTime() ? 'var(--bg-sink)' : 'transparent',
    };
  });
  const weekConcSamples = [];
  for (let day = 0; day < 7; day++) {
    for (let m = 9 * 60; m < 19 * 60; m += 30) {
      let n = 0;
      weekBranches.forEach((br) => {
        if (br.sessions.some((s2) => s2.day === day && s2.s <= m && s2.e > m)) n++;
      });
      weekConcSamples.push({
        leftPct: (((day * 600 + (m - 9 * 60)) / weekTotalMins) * 100).toFixed(3) + '%',
        widthPct: ((30 / weekTotalMins) * 100).toFixed(3) + '%',
        n,
        heightPct: ((n / Math.max(weekConc.peak, 1)) * 100).toFixed(1) + '%',
        bg: n === 0 ? 'transparent' : 'color-mix(in oklab, var(--sea) ' + (40 + n * 15) + '%, var(--bg-sink))',
      });
    }
  }
  const weekBranchCount = weekBranches.length;

  const weekHourTicks = [9, 11, 13, 15, 17, 19].map((h) => ({
    leftPct: (((h - 9) / 10) * 100).toFixed(2) + '%',
    label: pad2(h),
  }));

  // -- Month view data --
  const monthBase = new Date(baseDate.getFullYear(), baseDate.getMonth() + s.monthOffset, 1);
  const monthYear = monthBase.getFullYear();
  const monthIdx = monthBase.getMonth();
  const monthLabel = monthYear + '年 ' + (monthIdx + 1) + '月';
  const monthLabelEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][monthIdx];
  const monthFirstDay = new Date(monthYear, monthIdx, 1);
  const monthLastDay = new Date(monthYear, monthIdx + 1, 0);
  const monthFirstOffset = (monthFirstDay.getDay() + 6) % 7;
  const monthGridStart = addDays(monthFirstDay, -monthFirstOffset);
  const totalCells = Math.ceil((monthFirstOffset + monthLastDay.getDate()) / 7) * 7;
  const monthCells = Array.from({ length: totalCells }, (_, i) => {
    const d = addDays(monthGridStart, i);
    const inMonth = d.getMonth() === monthIdx;
    const st = dayStatsFor(d);
    const offFromToday = Math.round((d.getTime() - baseDate.getTime()) / (24 * 3600 * 1000));
    const isFuture = d.getTime() > baseDate.getTime();
    const isToday = d.getTime() === baseDate.getTime();
    const intensity = Math.min(1, st.hours / 8);
    return {
      dateNum: d.getDate(),
      wd: d.getDay(),
      inMonth,
      isToday,
      isFuture,
      weekend: isWeekend(d),
      ...st,
      hoursLabel: st.hours > 0 ? st.hours.toFixed(1) : '—',
      barHeight: (intensity * 100).toFixed(0) + '%',
      aiBarWidth: st.aiPct + '%',
      cellBg: isToday ? 'color-mix(in oklab, var(--accent) 10%, var(--bg))' : inMonth ? 'var(--bg)' : 'var(--bg-sink)',
      textColor: isFuture ? 'var(--ink-3)' : inMonth ? 'var(--ink)' : 'var(--ink-3)',
      opacity: isFuture ? 0.5 : inMonth ? 1 : 0.55,
      outline: isToday ? '2px solid var(--accent)' : '1px solid var(--rule)',
      jumpToDay: isFuture ? () => {} : jumpToDay(offFromToday),
      cursor: isFuture ? 'default' : 'pointer',
      prDots: Array.from({ length: Math.min(st.prs, 3) }, () => ({})),
    };
  });
  const monthInMonth = monthCells.filter((c) => c.inMonth && !c.isFuture);
  const monthTotals = monthInMonth.reduce(
    (a, d) => ({
      hours: a.hours + d.hours,
      sessions: a.sessions + d.sessions,
      prs: a.prs + d.prs,
      interrupts: a.interrupts + d.interrupts,
      aiMins: a.aiMins + (d.mins * d.aiPct) / 100,
      totalMins: a.totalMins + d.mins,
      activeDays: a.activeDays + (d.hours > 0 ? 1 : 0),
    }),
    { hours: 0, sessions: 0, prs: 0, interrupts: 0, aiMins: 0, totalMins: 0, activeDays: 0 }
  );
  monthTotals.hours = monthTotals.hours.toFixed(0);
  const monthAvgAi = monthTotals.totalMins > 0 ? Math.round((monthTotals.aiMins / monthTotals.totalMins) * 100) : 0;

  // log totals
  const totalSessions = sessions.length;
  const totalSubagents = sessions.reduce((a, s2) => a + s2.subagents.length, 0);
  const totalTools = sessions.reduce((a, s2) => a + s2.tools, 0);
  const totalInterrupts = sessions.reduce((a, s2) => a + s2.interrupts.length, 0);

  // -- Compass: 3×3 type matrix --
  const types = [
    { i: 0, name: '集中', en: 'Deep Focus', row: 0, col: 0, ai: 'AI 主導', par: '単一' },
    { i: 1, name: '探索', en: 'Explore', row: 0, col: 1, ai: 'AI 主導', par: '2 セッション' },
    { i: 2, name: '高委任並列', en: 'Deep Delegation', row: 0, col: 2, ai: 'AI 主導', par: '3+ セッション' },
    { i: 3, name: '対話協働', en: 'Pair', row: 1, col: 0, ai: '協働 (半々)', par: '単一' },
    { i: 4, name: 'バランス', en: 'Balanced', row: 1, col: 1, ai: '協働 (半々)', par: '2 セッション' },
    { i: 5, name: '協働並列', en: 'Squad', row: 1, col: 2, ai: '協働 (半々)', par: '3+ セッション' },
    { i: 6, name: '自力', en: 'Solo', row: 2, col: 0, ai: '自力中心', par: '単一' },
    { i: 7, name: '自力並列', en: 'Solo Pair', row: 2, col: 1, ai: '自力中心', par: '2 セッション' },
    { i: 8, name: '分散', en: 'Scatter', row: 2, col: 2, ai: '自力中心', par: '3+ セッション' },
  ];
  const cellDensity = [3, 6, 14, 8, 18, 28, 5, 9, 11];
  const maxD = Math.max(...cellDensity);

  const typeCells = types.map((t) => {
    const d = cellDensity[t.i];
    const intensity = d / maxD;
    const isSelected = t.i === s.selectedType;
    return {
      ...t,
      density: d,
      intensityPct: Math.round(intensity * 100),
      bg: 'color-mix(in oklab, var(--accent) ' + Math.round(8 + intensity * 72) + '%, var(--bg-panel))',
      labelColor: intensity > 0.5 ? 'var(--bg)' : 'var(--ink)',
      select: selectType(t.i),
      isSelected,
      outline: isSelected ? '2px solid var(--color-border)' : '1px solid var(--rule)',
      nameSize: isSelected ? '18px' : '15px',
    };
  });

  const selectedType = typeCells[s.selectedType] || typeCells[5];
  const oppositeIdx = 8 - s.selectedType;
  const oppositeType = typeCells[oppositeIdx];

  // -- Quarter: 13 weeks of Q2 --
  const weeks = [
    { w: 14, hr: 32, ai: 0.51, pr: 2, peak: 2, type: 4, label: '4/1', dayCon: [2, 2, 1, 1, 2, 0, 0], dayInt: [3, 4, 2, 1, 3, 0, 0], tools: { read: 62, edit: 48, bash: 34, task: 5, grep: 22 } },
    { w: 15, hr: 28, ai: 0.55, pr: 1, peak: 2, type: 4, label: '4/8', dayCon: [1, 2, 2, 1, 2, 0, 0], dayInt: [2, 3, 3, 1, 2, 0, 0], tools: { read: 55, edit: 42, bash: 30, task: 6, grep: 20 } },
    { w: 16, hr: 35, ai: 0.58, pr: 3, peak: 3, type: 4, label: '4/15', dayCon: [2, 3, 2, 2, 2, 1, 0], dayInt: [3, 5, 3, 2, 3, 1, 0], tools: { read: 70, edit: 55, bash: 32, task: 9, grep: 25 } },
    { w: 17, hr: 41, ai: 0.61, pr: 3, peak: 3, type: 4, label: '4/22', dayCon: [3, 3, 2, 3, 2, 1, 0], dayInt: [4, 5, 3, 4, 3, 1, 0], tools: { read: 82, edit: 64, bash: 38, task: 12, grep: 30 } },
    { w: 18, hr: 38, ai: 0.6, pr: 2, peak: 3, type: 4, label: '4/29', dayCon: [2, 3, 3, 2, 1, 1, 0], dayInt: [3, 4, 4, 3, 2, 0, 0], tools: { read: 76, edit: 60, bash: 36, task: 10, grep: 28 } },
    { w: 19, hr: 22, ai: 0.65, pr: 1, peak: 2, type: 3, label: '5/6', dayCon: [1, 2, 1, 1, 2, 0, 0], dayInt: [2, 3, 1, 1, 2, 0, 0], tools: { read: 48, edit: 38, bash: 24, task: 7, grep: 18 } },
    { w: 20, hr: 30, ai: 0.62, pr: 2, peak: 3, type: 4, label: '5/13', dayCon: [2, 2, 3, 2, 2, 1, 0], dayInt: [3, 3, 4, 2, 3, 1, 0], tools: { read: 62, edit: 50, bash: 30, task: 11, grep: 22 } },
    { w: 21, hr: 33, ai: 0.66, pr: 2, peak: 3, type: 5, label: '5/20', dayCon: [2, 3, 3, 2, 2, 1, 0], dayInt: [3, 4, 5, 3, 3, 1, 0], tools: { read: 68, edit: 54, bash: 32, task: 14, grep: 24 } },
    { w: 22, hr: 36, ai: 0.68, pr: 3, peak: 4, type: 5, label: '5/27', dayCon: [3, 4, 3, 3, 2, 1, 0], dayInt: [4, 5, 4, 4, 3, 1, 0], tools: { read: 74, edit: 58, bash: 34, task: 18, grep: 26 } },
    { w: 23, hr: 28, ai: 0.7, pr: 2, peak: 3, type: 5, label: '6/3', dayCon: [3, 3, 3, 2, 2, 0, 0], dayInt: [3, 4, 4, 3, 3, 0, 0], tools: { read: 60, edit: 46, bash: 28, task: 16, grep: 22 } },
    { w: 24, hr: 30, ai: 0.69, pr: 2, peak: 3, type: 5, label: '6/10', dayCon: [2, 3, 3, 3, 2, 1, 0], dayInt: [3, 4, 5, 4, 3, 1, 0], tools: { read: 64, edit: 50, bash: 30, task: 17, grep: 24 } },
    { w: 25, hr: 34, ai: 0.67, pr: 3, peak: 4, type: 5, label: '6/17', dayCon: [3, 3, 4, 3, 2, 1, 0], dayInt: [3, 4, 5, 4, 3, 1, 0], tools: { read: 72, edit: 56, bash: 32, task: 20, grep: 26 } },
    { w: 26, hr: 29, ai: 0.68, pr: 2, peak: 3, type: 5, label: '6/24', dayCon: [3, 3, 3, 2, 2, 0, 0], dayInt: [4, 4, 4, 3, 3, 0, 0], tools: { read: 62, edit: 48, bash: 28, task: 18, grep: 22 } },
  ];
  const typeNames = ['集中', '探索', '高委任並列', '対話協働', 'バランス', '協働並列', '自力', '自力並列', '分散'];

  const cW = 1000, cH = 220, padL = 50, padR = 30, padT = 20, padB = 40;
  const innerW = cW - padL - padR;
  const innerH = cH - padT - padB;
  const xAt = (i) => padL + (i / (weeks.length - 1)) * innerW;
  const maxHr = 45;
  const hrY = (hr) => padT + (1 - hr / maxHr) * innerH;
  const aiY = (ai) => padT + (1 - ai) * innerH;

  const chartPoints = weeks.map((w, i) => ({
    x: xAt(i).toFixed(1),
    hrY: hrY(w.hr).toFixed(1),
    aiY: aiY(w.ai).toFixed(1),
    label: w.label,
    prDots: Array.from({ length: w.pr }, (_, k) => ({ y: cH - padB + 10 + k * 5 })),
  }));
  const hrPath = 'M ' + chartPoints.map((p, i) => (i === 0 ? '' : 'L ') + p.x + ' ' + p.hrY).join(' ');
  const hrArea = hrPath + ' L ' + chartPoints[chartPoints.length - 1].x + ' ' + (cH - padB) + ' L ' + chartPoints[0].x + ' ' + (cH - padB) + ' Z';
  const aiPath = 'M ' + chartPoints.map((p, i) => (i === 0 ? '' : 'L ') + p.x + ' ' + p.aiY).join(' ');

  const hrAxisLabels = [0, 15, 30, 45].map((v) => ({ v, y: hrY(v).toFixed(1) }));
  const aiAxisLabels = [0, 25, 50, 75, 100].map((v) => ({ v, y: aiY(v / 100).toFixed(1) }));

  const chartAnnotations = [
    { x: xAt(5).toFixed(1), y1: padT.toFixed(1), label: 'GW 連休' },
    { x: xAt(11).toFixed(1), y1: padT.toFixed(1), label: 'ピーク並列 4' },
  ];

  const sw = Math.max(0, Math.min(12, s.scrubWeek));
  const scrubX = xAt(sw).toFixed(1);
  const scrubWeekData = weeks[sw];
  const scrubHrY = hrY(scrubWeekData.hr).toFixed(1);
  const scrubAiY = aiY(scrubWeekData.ai).toFixed(1);

  const dayLabels = ['月', '火', '水', '木', '金', '土', '日'];
  const maxCon = Math.max(...weeks.flatMap((w) => w.dayCon));
  const maxInt = Math.max(...weeks.flatMap((w) => w.dayInt));
  const heatRows = weeks.map((w, wi) => ({
    label: 'W' + w.w,
    wi,
    cellsCon: w.dayCon.map((v, di) => ({
      v,
      di,
      bg: v === 0 ? 'var(--bg-sink)' : 'color-mix(in oklab, var(--sea) ' + (12 + (v / maxCon) * 78) + '%, var(--bg-panel))',
      textColor: v >= maxCon * 0.7 ? 'var(--bg)' : 'var(--ink-2)',
      outline: wi === sw ? '1px solid var(--accent)' : 'none',
    })),
    cellsInt: w.dayInt.map((v, di) => ({
      v,
      di,
      bg: v === 0 ? 'var(--bg-sink)' : 'color-mix(in oklab, var(--accent) ' + (10 + (v / maxInt) * 80) + '%, var(--bg-panel))',
      textColor: v >= maxInt * 0.7 ? 'var(--bg)' : 'var(--ink-2)',
      outline: wi === sw ? '1px solid var(--color-border)' : 'none',
    })),
  }));

  const trajRibbonRich = weeks.map((w, wi) => ({
    label: 'W' + w.w,
    typeName: typeNames[w.type],
    typeIdx: w.type,
    isScrub: wi === sw,
    bg: wi === sw ? 'var(--bg-panel)' : 'transparent',
    border: wi === sw ? '1px solid var(--color-border)' : '1px solid var(--rule)',
    miniCells: Array.from({ length: 9 }, (_, i) => ({
      bg: i === w.type ? 'var(--accent)' : 'var(--rule)',
    })),
  }));

  const toolKinds = [
    { id: 'read', label: 'Read', color: 'var(--sea)' },
    { id: 'edit', label: 'Edit', color: 'color-mix(in oklab, var(--sea) 60%, var(--accent))' },
    { id: 'bash', label: 'Bash', color: 'color-mix(in oklab, var(--ink) 60%, var(--bg))' },
    { id: 'task', label: 'Task', color: 'var(--accent)' },
    { id: 'grep', label: 'Grep', color: 'color-mix(in oklab, var(--ink) 35%, var(--bg))' },
  ];
  const maxToolTotal = Math.max(...weeks.map((w) => Object.values(w.tools).reduce((a, b) => a + b, 0)));
  const toolBars = weeks.map((w, wi) => {
    const total = Object.values(w.tools).reduce((a, b) => a + b, 0);
    const h = (total / maxToolTotal) * 100;
    let cumulative = 0;
    const segs = toolKinds.map((k) => {
      const v = w.tools[k.id];
      const segPct = (v / total) * 100;
      const seg = {
        id: k.id,
        color: k.color,
        height: ((segPct * h) / 100).toFixed(2) + '%',
        bottom: ((cumulative * h) / 100).toFixed(2) + '%',
      };
      cumulative += segPct;
      return seg;
    });
    return {
      label: 'W' + w.w,
      wi,
      segs,
      labelColor: wi === sw ? 'var(--accent)' : 'var(--ink-3)',
    };
  });
  const totalToolMix = toolKinds.map((k) => {
    const v = weeks.reduce((a, w) => a + w.tools[k.id], 0);
    const total = weeks.reduce((a, w) => a + Object.values(w.tools).reduce((x, y) => x + y, 0), 0);
    return { ...k, v, pct: ((v / total) * 100).toFixed(0) };
  });

  const quarterStats = [
    { label: '最長集中', value: '68', unit: '分', sub: 'W22 火 14:20–15:28' },
    { label: '最長中断', value: '42', unit: '分', sub: 'W17 金 PR レビュー' },
    { label: '平均並列度', value: '2.4', unit: '隻', sub: '実働時間で重みづけ' },
    { label: 'Subagent', value: '164', unit: '回', sub: 'Task ツール起動回数' },
    { label: 'PR レビュー', value: '31', unit: '件', sub: 'うち自分発 26' },
    { label: '再着手', value: '18', unit: '回', sub: '同セッションの再開' },
  ];

  return {
    isIndex: s.screen === 'index',
    isToday: s.screen === 'today',
    isLog: s.screen === 'log',
    isCompass: s.screen === 'compass',
    isQuarter: s.screen === 'quarter',
    navItems,
    currentNavIndex: screens.indexOf(s.screen),
    tocItems,
    todayStats,
    aiPct, mnPct,
    aiHours, aiMins, mnHours, mnMins,
    aiSumAi, aiSumMn, aiSumTotal,
    aiActsRich, mnActsRich,
    aiBarWidthPct, mnBarWidthPct,
    minAxisTicks,
    parYAxis, parBars, parXAxis,
    parChartW, parChartH,
    parPeakBar, parAvg, parDist, maxPar,
    highlights,
    sessionsRich,
    selectedSess,
    hourTicks,
    dayHourTicks,
    branchRows,
    totalSessionsLabel,
    totalSessions,
    totalSubagents,
    totalTools,
    totalInterrupts,
    logView: s.logView,
    logViewItems: [{ value: 'day', label: 'Daily' }, { value: 'week', label: 'Weekly' }, { value: 'month', label: 'Monthly' }],
    onLogViewChange: (v) => setState({ logView: v }),
    isLogDay: s.logView === 'day',
    isLogWeek: s.logView === 'week',
    isLogMonth: s.logView === 'month',
    dayLabel, dayLabelShort, isToday_,
    isNotToday: !isToday_,
    viewedDateStats,
    headerDateLabel: dayLabel + (isToday_ ? ' · 本日' : ' · archived'),
    dayViewHours: isToday_ ? '6.7' : viewedDateStats.hours.toFixed(1),
    dayViewAiPct: isToday_ ? 67 : viewedDateStats.aiPct,
    dayViewSessions: isToday_ ? sessions.length : viewedDateStats.sessions,
    dayViewSubagents: isToday_ ? sessions.reduce((a, s2) => a + s2.subagents.length, 0) : viewedDateStats.subagents,
    dayViewTools: isToday_ ? sessions.reduce((a, s2) => a + s2.tools, 0) : viewedDateStats.tools,
    dayViewInterrupts: isToday_ ? sessions.reduce((a, s2) => a + s2.interrupts.length, 0) : viewedDateStats.interrupts,
    dayViewPeak: isToday_ ? 4 : viewedDateStats.peak,
    dayViewPrs: isToday_ ? 1 : viewedDateStats.prs,
    viewedDayBars: daySessionsFor(viewedDate).map((b) => ({
      leftPct: (((b.s - 9 * 60) / (10 * 60)) * 100).toFixed(2) + '%',
      widthPct: (((b.e - b.s) / (10 * 60)) * 100).toFixed(2) + '%',
      bg: b.ai ? 'var(--ai)' : 'var(--human)',
    })),
    viewedIntTicks: dayInterruptsFor(viewedDate).map((m) => ({
      leftPct: (((m - 9 * 60) / (10 * 60)) * 100).toFixed(2) + '%',
    })),
    weekHourTicks,
    shiftDayPrev: shiftDay(-1),
    shiftDayNext: shiftDay(1),
    shiftDayToToday: shiftDay(-s.dayOffset),
    canShiftDayNext: s.dayOffset < 0,
    dayNextDisabled: !(s.dayOffset < 0),
    datePickerOpen: s.datePickerOpen,
    toggleDatePicker: toggleDatePicker(),
    viewedDateISO: fmtISO(viewedDate),
    maxDateISO: fmtISO(baseDate),
    onDatePickerSelect: jumpToDate,
    weekDays, weekTotals, weekAvgAi, weekLabel, weekRangeLabel,
    weekBranchesRich, weekBranchCount, weekDayCols, weekConcSamples,
    weekConcPeak: weekConc.peak,
    weekConcAvg: weekConc.avg,
    shiftWeekPrev: shiftWeek(-1),
    shiftWeekNext: shiftWeek(1),
    canShiftWeekNext: s.weekOffset < 0,
    weekNextDisabled: !(s.weekOffset < 0),
    monthCells, monthTotals, monthAvgAi, monthLabel, monthLabelEn,
    shiftMonthPrev: shiftMonth(-1),
    shiftMonthNext: shiftMonth(1),
    canShiftMonthNext: s.monthOffset < 0,
    monthNextDisabled: !(s.monthOffset < 0),
    monthCols: ['月', '火', '水', '木', '金', '土', '日'],
    typeCells,
    selectedType,
    oppositeType,
    cW, cH,
    hrPath, hrArea, aiPath,
    chartPoints, chartAnnotations,
    hrAxisLabels, aiAxisLabels,
    chartBaseline: cH - padB,
    scrubX, scrubHrY, scrubAiY,
    scrubWeekLabel: 'W' + scrubWeekData.w,
    scrubWeekDate: scrubWeekData.label,
    scrubWeekHr: scrubWeekData.hr,
    scrubWeekAi: Math.round(scrubWeekData.ai * 100),
    scrubWeekPr: scrubWeekData.pr,
    scrubWeekPeak: scrubWeekData.peak,
    scrubWeekType: typeNames[scrubWeekData.type],
    scrubWeekToolTotal: Object.values(scrubWeekData.tools).reduce((a, b) => a + b, 0),
    scrubWeekInterrupts: scrubWeekData.dayInt.reduce((a, b) => a + b, 0),
    onScrubDown,
    heatRows, dayLabels, maxCon, maxInt,
    trajRibbonRich,
    toolBars, totalToolMix,
    quarterStats,
  };
}
