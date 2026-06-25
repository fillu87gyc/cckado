import { useState, useEffect } from 'react';

// Port of the prototype's `state` + action methods + renderVals(), now fed by
// real data fetched from the local devstyle server (/api/activity). The pure
// view-math in renderVals() is unchanged; only the *source facts* (sessions,
// weeks, per-day stats, compass density, …) now come from `data` instead of
// hardcoded arrays.

export function useActivityLog() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [project, setProject] = useState('');

  useEffect(() => {
    let alive = true;
    setData(null);
    setLoadError(null);
    const qs = project ? `?project=${encodeURIComponent(project)}` : '';
    fetch(`/api/activity${qs}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setLoadError(e.message || String(e));
      });
    return () => {
      alive = false;
    };
  }, [project]);

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

  const actions = {
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
    setProject,
  };

  // Until data arrives, return a minimal vm so the chrome (nav) renders and the
  // screens show a loading/error state instead of crashing on missing arrays.
  if (!data) {
    return {
      ...loadingVm(state, actions),
      isLoading: !loadError,
      loadError,
    };
  }

  const vm = renderVals(state, actions, data);
  vm.isLoading = false;
  vm.loadError = null;
  vm.projects = data.meta.projects || [];
  vm.currentProject = project;
  vm.setProject = setProject;
  return vm;
}

// Nav items + screen flags only — enough for App to render the header/tabs
// while data is loading or failed.
function loadingVm(s, actions) {
  const screens = ['index', 'today', 'log', 'compass', 'quarter'];
  const navJp = { index: '序', today: '本日', log: '日誌', compass: '分布', quarter: '四半期推移' };
  const navEn = { index: 'Index', today: 'Today', log: 'Log', compass: 'Compass', quarter: 'Quarter' };
  const navIcon = { index: 'menu_book', today: 'today', log: 'list_alt', compass: 'donut_small', quarter: 'insights' };
  const navItems = screens.map((sc) => ({
    jp: navJp[sc],
    en: navEn[sc],
    icon: navIcon[sc],
    go: actions.go(sc),
    iconOpacity: s.screen === sc ? 1 : 0.7,
  }));
  return {
    navItems,
    currentNavIndex: screens.indexOf(s.screen),
    headerLine: '— · —',
    isIndex: false,
    isToday: false,
    isLog: false,
    isCompass: false,
    isQuarter: false,
  };
}

function renderVals(s, actions, data) {
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

  const todayStats = data.todayStats;

  // -- § 1 AI vs Manual: horizontal split bar + activity breakdown --
  const aiSumAi = data.aiSumAi; // tool-active minutes (today)
  const aiSumMn = data.aiSumMn; // idle / wait minutes (today)
  const aiSumTotal = aiSumAi + aiSumMn || 1;
  const aiPct = Math.round((aiSumAi / aiSumTotal) * 100);
  const mnPct = 100 - aiPct;
  const aiHours = Math.floor(aiSumAi / 60);
  const aiMins = aiSumAi % 60;
  const mnHours = Math.floor(aiSumMn / 60);
  const mnMins = aiSumMn % 60;

  const aiActivities = data.aiActivities;
  const mnActivities = data.mnActivities;
  const fmtMins = (m) => {
    const h = Math.floor(m / 60),
      mm = m % 60;
    return h > 0 ? h + 'h ' + String(mm).padStart(2, '0') + 'm' : mm + 'm';
  };
  const aiSideDiv = aiSumAi || 1;
  const mnSideDiv = aiSumMn || 1;
  const aiActsRich = aiActivities.map((a) => ({
    ...a,
    pctOfSide: ((a.mins / aiSideDiv) * 100).toFixed(2) + '%',
    pctOfTotal: ((a.mins / aiSumTotal) * 100).toFixed(2) + '%',
    pctOfSideNum: Math.round((a.mins / aiSideDiv) * 100),
    durLabel: fmtMins(a.mins),
  }));
  const mnActsRich = mnActivities.map((a) => ({
    ...a,
    pctOfSide: ((a.mins / mnSideDiv) * 100).toFixed(2) + '%',
    pctOfTotal: ((a.mins / aiSumTotal) * 100).toFixed(2) + '%',
    pctOfSideNum: Math.round((a.mins / mnSideDiv) * 100),
    durLabel: fmtMins(a.mins),
  }));
  const aiBarWidthPct = ((aiSumAi / aiSumTotal) * 100).toFixed(3) + '%';
  const mnBarWidthPct = ((aiSumMn / aiSumTotal) * 100).toFixed(3) + '%';
  const totalMinAxis = [...[0, 60, 120, 180, 240, 300, 360].filter((m) => m < aiSumTotal), aiSumTotal];
  const minAxisTicks = totalMinAxis.map((m) => ({
    m,
    label: fmtMins(m),
    leftPct: ((m / aiSumTotal) * 100).toFixed(2) + '%',
    isBoundary: m === aiSumAi,
  }));

  // -- § 2 Parallel: discrete step bars with Y guidelines --
  const parData = data.parData && data.parData.length ? data.parData : [0];
  const maxPar = Math.max(1, ...parData);
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

  const highlights = data.highlights || [];

  // -- Log: sessions with subagent lanes --
  const dayStart = 8 * 60;
  const dayEnd = 20 * 60;
  const dayMin = dayEnd - dayStart;
  const scaleX = (m) => ((m - dayStart) / dayMin) * 100;
  const fmt = (m) => {
    const hh = Math.floor(m / 60),
      mm = m % 60;
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  };

  const sessions = data.focalSessions || [];

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
  for (let h = 8; h <= 20; h++) {
    hourTicks.push({ h, leftPct: scaleX(h * 60).toFixed(2) + '%', label: String(h).padStart(2, '0') + ':00' });
  }
  const dayHourTicks = [8, 10, 12, 14, 16, 18, 20].map((h) => ({
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
  // "today" = latest activity date from the ingested data.
  const [by, bm, bd] = (data.meta.today || '').split('-').map(Number);
  const baseDate = new Date(by || 2026, (bm || 1) - 1, bd || 1);
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

  // Per-day facts come from the ingested data; missing days render as empty.
  const daily = data.daily || {};
  const ZERO_DAY = { hours: 0, mins: 0, aiPct: 0, sessions: 0, subagents: 0, prs: 0, peak: 0, interrupts: 0, tools: 0 };
  const dayStatsFor = (d) => {
    const dd = daily[fmtISO(d)];
    if (!dd) return ZERO_DAY;
    return {
      hours: dd.hours,
      mins: dd.mins,
      aiPct: dd.aiPct,
      sessions: dd.sessions,
      subagents: dd.subagents,
      prs: dd.prs,
      peak: dd.peak,
      interrupts: dd.interrupts,
      tools: dd.tools,
    };
  };
  const daySessionsFor = (d) => (daily[fmtISO(d)]?.bars || []);
  const dayInterruptsFor = (d) => (daily[fmtISO(d)]?.intMins || []);

  const viewedDate = addDays(baseDate, s.dayOffset);
  const viewedDateStats = dayStatsFor(viewedDate);
  const isToday_ = s.dayOffset === 0;
  const dayLabel = fmtDateFull(viewedDate) + ' (' + wdJp[viewedDate.getDay()] + ')';
  const dayLabelShort = viewedDate.getMonth() + 1 + '月' + viewedDate.getDate() + '日 ' + wdJp[viewedDate.getDay()] + '曜';

  // -- Week view data --
  const weekBase = addDays(baseDate, s.weekOffset * 7);
  const weekStartOffset = (weekBase.getDay() + 6) % 7;
  const weekStart = addDays(weekBase, -weekStartOffset);

  // weekBranches computed early so weekDays can reference it. Built from the
  // ingested per-day lanes (sessions grouped by gitBranch).
  const buildWeekBranches = (weekStartDate) => {
    const map = new Map();
    for (let day = 0; day < 7; day++) {
      const d = addDays(weekStartDate, day);
      const dd = daily[fmtISO(d)];
      if (!dd) continue;
      (dd.lanes || []).forEach((l) => {
        if (!map.has(l.name)) map.set(l.name, []);
        l.sessions.forEach((ss) => map.get(l.name).push({ day, s: ss.s, e: ss.e, ai: ss.ai }));
      });
    }
    return [...map.entries()]
      .map(([name, sessions]) => ({ name, sessions }))
      .filter((b) => b.sessions.length > 0)
      .sort((a, b) => b.sessions.reduce((x, ss) => x + (ss.e - ss.s), 0) - a.sessions.reduce((x, ss) => x + (ss.e - ss.s), 0));
  };
  const weekBranches = buildWeekBranches(weekStart);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const st = dayStatsFor(d);
    const sess = daySessionsFor(d);
    const ints = dayInterruptsFor(d);
    const offFromToday = Math.round((d.getTime() - baseDate.getTime()) / (24 * 3600 * 1000));
    const sessBars = sess.map((b) => ({
      leftPct: (((b.s - 8 * 60) / (12 * 60)) * 100).toFixed(2) + '%',
      widthPct: (((b.e - b.s) / (12 * 60)) * 100).toFixed(2) + '%',
      bg: b.ai ? 'var(--ai)' : 'var(--human)',
    }));
    const intTicks = ints.map((m) => ({ leftPct: (((m - 8 * 60) / (12 * 60)) * 100).toFixed(2) + '%' }));
    const dayLanesRaw = weekBranches
      .map((br) => {
        const onDay = br.sessions.filter((s2) => s2.day === i);
        return { name: br.name, sessions: onDay };
      })
      .filter((l) => l.sessions.length > 0);
    const dayLanes = dayLanesRaw.map((l) => ({
      name: l.name,
      bars: l.sessions.map((b) => ({
        leftPct: (((b.s - 8 * 60) / (12 * 60)) * 100).toFixed(2) + '%',
        widthPct: (((b.e - b.s) / (12 * 60)) * 100).toFixed(2) + '%',
        bg: b.ai ? 'var(--ai)' : 'var(--human)',
      })),
    }));
    let dayConcPeak = 0;
    for (let m = 8 * 60; m < 20 * 60; m += 30) {
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
      for (let m = 8 * 60; m < 20 * 60; m += 30) {
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
  const weekTotalMins = 7 * 720;
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
        leftPct: (((blk.day * 720 + (blk.s - 8 * 60)) / weekTotalMins) * 100).toFixed(3) + '%',
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
    for (let m = 8 * 60; m < 20 * 60; m += 30) {
      let n = 0;
      weekBranches.forEach((br) => {
        if (br.sessions.some((s2) => s2.day === day && s2.s <= m && s2.e > m)) n++;
      });
      weekConcSamples.push({
        leftPct: (((day * 720 + (m - 8 * 60)) / weekTotalMins) * 100).toFixed(3) + '%',
        widthPct: ((30 / weekTotalMins) * 100).toFixed(3) + '%',
        n,
        heightPct: ((n / Math.max(weekConc.peak, 1)) * 100).toFixed(1) + '%',
        bg: n === 0 ? 'transparent' : 'color-mix(in oklab, var(--sea) ' + (40 + n * 15) + '%, var(--bg-sink))',
      });
    }
  }
  const weekBranchCount = weekBranches.length;

  const weekHourTicks = [8, 10, 12, 14, 16, 18, 20].map((h) => ({
    leftPct: (((h - 8) / 12) * 100).toFixed(2) + '%',
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
  const cellDensity = data.compass && data.compass.length === 9 ? data.compass : [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const maxD = Math.max(1, ...cellDensity);

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
  const weeks = data.weeks && data.weeks.length ? data.weeks : [{ w: 0, hr: 0, ai: 0, pr: 0, peak: 0, type: 4, label: '—', dayCon: [0, 0, 0, 0, 0, 0, 0], dayInt: [0, 0, 0, 0, 0, 0, 0], tools: { read: 0, edit: 0, bash: 0, task: 0, grep: 0 } }];
  const typeNames = ['集中', '探索', '高委任並列', '対話協働', 'バランス', '協働並列', '自力', '自力並列', '分散'];

  const cW = 1000, cH = 220, padL = 50, padR = 30, padT = 20, padB = 40;
  const innerW = cW - padL - padR;
  const innerH = cH - padT - padB;
  const xAt = (i) => padL + (i / (weeks.length - 1 || 1)) * innerW;
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

  const sw = Math.max(0, Math.min(weeks.length - 1, s.scrubWeek));
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

  const quarterStats = data.quarterStats || [];

  return {
    isIndex: s.screen === 'index',
    isToday: s.screen === 'today',
    isLog: s.screen === 'log',
    isCompass: s.screen === 'compass',
    isQuarter: s.screen === 'quarter',
    navItems,
    currentNavIndex: screens.indexOf(s.screen),
    headerLine:
      baseDate.getFullYear() +
      ' Q' + (Math.floor(baseDate.getMonth() / 3) + 1) +
      ' · W' + (weeks[weeks.length - 1]?.w ?? 0) +
      ' · ' + (baseDate.getMonth() + 1) + '/' + baseDate.getDate() +
      ' (' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][baseDate.getDay()] + ')',
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
    dayViewHours: viewedDateStats.hours.toFixed(1),
    dayViewAiPct: viewedDateStats.aiPct,
    dayViewSessions: viewedDateStats.sessions,
    dayViewSubagents: viewedDateStats.subagents,
    dayViewTools: viewedDateStats.tools,
    dayViewInterrupts: viewedDateStats.interrupts,
    dayViewPeak: viewedDateStats.peak,
    dayViewPrs: viewedDateStats.prs,
    viewedDayBars: daySessionsFor(viewedDate).map((b) => ({
      leftPct: (((b.s - 8 * 60) / (12 * 60)) * 100).toFixed(2) + '%',
      widthPct: (((b.e - b.s) / (12 * 60)) * 100).toFixed(2) + '%',
      bg: b.ai ? 'var(--ai)' : 'var(--human)',
    })),
    viewedIntTicks: dayInterruptsFor(viewedDate).map((m) => ({
      leftPct: (((m - 8 * 60) / (12 * 60)) * 100).toFixed(2) + '%',
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
    // freee人事労務の期間選択に倣った週ピッカー (SelectBox 用): W14..W26 を直接選べる。
    weekPickerValue: String(s.weekOffset),
    weekPickerOptions: Array.from({ length: 13 }, (_, i) => {
      const off = i - 12;
      return { value: String(off), name: 'W' + (26 + off) };
    }),
    onWeekPick: (e) => setState({ weekOffset: Number(e.target.value) }),
    shiftWeekToThis: () => setState({ weekOffset: 0 }),
    weekIsThis: s.weekOffset === 0,
    monthCells, monthTotals, monthAvgAi, monthLabel, monthLabelEn,
    shiftMonthPrev: shiftMonth(-1),
    shiftMonthNext: shiftMonth(1),
    canShiftMonthNext: s.monthOffset < 0,
    monthNextDisabled: !(s.monthOffset < 0),
    // freee人事労務の期間選択に倣った月ピッカー (SelectBox 用): 直近 6 か月を直接選べる。
    monthPickerValue: String(s.monthOffset),
    monthPickerOptions: Array.from({ length: 6 }, (_, i) => {
      const off = i - 5;
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + off, 1);
      return { value: String(off), name: d.getFullYear() + '年' + (d.getMonth() + 1) + '月' };
    }),
    onMonthPick: (e) => setState({ monthOffset: Number(e.target.value) }),
    shiftMonthToThis: () => setState({ monthOffset: 0 }),
    monthIsThis: s.monthOffset === 0,
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
