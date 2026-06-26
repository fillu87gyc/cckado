import { listProjects } from './paths.mjs';
import { parseJsonl } from './parseJsonl.mjs';
import { normalizeSession } from './normalize.mjs';
import { readConfig } from './config.mjs';
import { engagementScore, engagementRow, concurrencyCol, cellIndex } from './classify.mjs';

// ---- small date/time helpers (local time; this is a local-only tool) ----
const minOfDay = (d) => d.getHours() * 60 + d.getMinutes();
const pad2 = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  r.setHours(0, 0, 0, 0);
  return r;
};
const startOfDay = (d) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};
// Monday-based week start.
const weekStart = (d) => addDays(d, -(((d.getDay() + 6) % 7)));
// ISO-week number (good enough for labeling the quarter axis).
function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDay = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - firstDay + 3);
  return 1 + Math.round((date - firstThu) / (7 * 24 * 3600 * 1000));
}

// tool name -> visual kind bucket used across the UI.
function kindOf(name) {
  if (name === 'Read') return 'read';
  if (name === 'Grep' || name === 'Glob') return 'grep';
  if (name === 'Bash') return 'bash';
  if (name === 'Task') return 'task';
  if (name === 'Edit' || name === 'Write' || name === 'MultiEdit' || name === 'NotebookEdit')
    return 'edit';
  return 'bash';
}

const overlaps = (a, b) =>
  a.firstTs && a.lastTs && b.firstTs && b.lastTs && a.firstTs <= b.lastTs && b.firstTs <= a.lastTs;

function emptyFacts(cfg, project) {
  const today = isoDate(new Date());
  return {
    meta: { today, generatedAt: new Date().toISOString(), project: project || null, projects: cfg.projects || [], empty: true },
    todayStats: [
      { label: '作業時間', value: '0:00', unit: 'h', sub: 'データなし' },
      { label: 'セッション', value: '0', unit: '件', sub: '—' },
      { label: '並列ピーク', value: '0', unit: '隻', sub: '—' },
      { label: '中断', value: '0', unit: '件', sub: '—' },
    ],
    aiSumAi: 0,
    aiSumMn: 0,
    aiActivities: [],
    mnActivities: [{ label: '(待機時間・内訳取得不可)', mins: 0 }],
    parData: [0],
    highlights: [],
    focalSessions: [],
    daily: {},
    weeks: buildEmptyWeeks(new Date()),
    compass: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    quarterStats: [],
  };
}

function buildEmptyWeeks(refDate) {
  const out = [];
  const thisWeekStart = weekStart(refDate);
  for (let i = 12; i >= 0; i--) {
    const ws = addDays(thisWeekStart, -i * 7);
    out.push({
      w: isoWeek(ws),
      hr: 0,
      ai: 0,
      pr: 0,
      peak: 0,
      type: 4,
      label: `${ws.getMonth() + 1}/${ws.getDate()}`,
      dayCon: [0, 0, 0, 0, 0, 0, 0],
      dayInt: [0, 0, 0, 0, 0, 0, 0],
      tools: { read: 0, edit: 0, bash: 0, task: 0, grep: 0 },
    });
  }
  return out;
}

export function aggregate({ project } = {}) {
  const cfg = readConfig();
  const projs = listProjects();

  // Load + normalize every session file.
  let sessions = [];
  for (const p of projs) {
    for (const f of p.sessionFiles) {
      const recs = parseJsonl(f);
      if (!recs.length) continue;
      const s = normalizeSession(recs);
      if (s.firstTs && s.lastTs) sessions.push(s);
    }
  }

  // Project list for the selector = distinct cwd roots seen in the data,
  // merged with config (so all-projects "All" is the default).
  const projectPaths = [...new Set(sessions.map((s) => s.cwd).filter(Boolean))];
  const projectList = projectPaths.map((path) => ({
    path,
    name: path.split('/').filter(Boolean).pop() || path,
  }));

  if (project) sessions = sessions.filter((s) => s.cwd === project);
  if (!sessions.length) {
    const e = emptyFacts(cfg, project);
    e.meta.projects = projectList.length ? projectList : cfg.projects || [];
    return e;
  }

  // "today" = latest activity date in the (filtered) data.
  const lastMs = Math.max(...sessions.map((s) => s.lastTs.getTime()));
  const todayDate = startOfDay(new Date(lastMs));
  const todayIso = isoDate(todayDate);

  // ---- per-session rich derivation ----
  const rich = sessions.map((s) => {
    const overlap = sessions.filter((o) => overlaps(s, o)).length; // includes self
    const s1 = engagementScore(s);
    const row = engagementRow(s1);
    const col = concurrencyCol(overlap);
    const cell = cellIndex(row, col);

    const startMin = minOfDay(s.firstTs);
    const endMin = Math.max(startMin + 1, minOfDay(s.lastTs));
    const day = isoDate(s.firstTs);

    // main bars (non-Task tools), clamped to >=1 min and within the day window.
    const main = s.toolUses
      .filter((t) => kindOf(t.name) !== 'task')
      .map((t) => {
        const bs = minOfDay(t.start);
        const be = Math.max(bs + 1, minOfDay(t.end));
        return { kind: kindOf(t.name), s: bs, e: Math.min(be, 24 * 60) };
      })
      .filter((b) => b.e > b.s);

    // subagents from Task tool_use spans.
    let taskN = 0;
    const subagents = s.toolUses
      .filter((t) => t.name === 'Task')
      .map((t) => {
        taskN += 1;
        const bs = minOfDay(t.start);
        const be = Math.max(bs + 1, minOfDay(t.end));
        const deleg = t.input?.description || t.input?.prompt || '';
        return {
          name: `task-${taskN}`,
          delegation: String(deleg).split('\n')[0].slice(0, 80),
          tasks: [{ kind: 'task', s: bs, e: be }],
        };
      });

    // AI active time vs idle gaps inside the session window.
    let activeMs = 0;
    for (const t of s.toolUses) activeMs += Math.max(0, t.end.getTime() - t.start.getTime());
    const spanMin = Math.max(1, Math.round((s.lastTs - s.firstTs) / 60000));
    const aiMin = Math.min(spanMin, Math.round(activeMs / 60000));
    const waitMin = Math.max(0, spanMin - aiMin);
    const aiPct = spanMin ? Math.round((aiMin / spanMin) * 100) : 0;

    const interrupts = s.interrupts.map((it) => ({
      t: `${pad2(it.ts.getHours())}:${pad2(it.ts.getMinutes())}`,
      msg: it.msg || '中断',
    }));

    return {
      raw: s,
      day,
      cell,
      overlap,
      id: (s.sessionId || '').slice(0, 8) || 'sess',
      branch: s.gitBranch || (s.cwd ? s.cwd.split('/').pop() : 'main'),
      title: s.title || '(無題セッション)',
      repo: s.cwd ? s.cwd.split('/').slice(-2).join('/') : '',
      start: startMin,
      end: endMin,
      aiPct,
      aiMin,
      waitMin,
      tools: s.toolUses.length,
      main,
      subagents,
      interrupts,
      kind: s.kind,
    };
  });

  // ---- focal sessions (today) ----
  const focalSessions = rich
    .filter((r) => r.day === todayIso)
    .sort((a, b) => a.start - b.start)
    .map((r) => ({
      id: r.id,
      branch: r.branch,
      title: r.title,
      repo: r.repo,
      start: r.start,
      end: r.end,
      aiPct: r.aiPct,
      tools: r.tools,
      aiMin: r.aiMin,
      planMin: 0,
      waitMin: r.waitMin,
      initial: r.title,
      main: r.main,
      subagents: r.subagents,
      interrupts: r.interrupts,
    }));

  // ---- daily map ----
  const daily = {};
  const byDay = new Map();
  for (const r of rich) {
    if (!byDay.has(r.day)) byDay.set(r.day, []);
    byDay.get(r.day).push(r);
  }
  for (const [iso, list] of byDay) {
    const mins = list.reduce((a, r) => a + (r.end - r.start), 0);
    const aiMinSum = list.reduce((a, r) => a + r.aiMin, 0);
    const subagents = list.reduce((a, r) => a + r.subagents.length, 0);
    const interrupts = list.reduce((a, r) => a + r.interrupts.length, 0);
    const tools = list.reduce((a, r) => a + r.tools, 0);
    const parents = list.filter((r) => r.kind === 'parent');

    // per-day concurrency peak over 30-min buckets.
    let peak = 0;
    for (let m = 0; m < 24 * 60; m += 30) {
      const n = list.filter((r) => r.start <= m && r.end > m).length;
      if (n > peak) peak = n;
    }

    // lanes by branch (for week multi-lane view).
    const laneMap = new Map();
    for (const r of list) {
      if (!laneMap.has(r.branch)) laneMap.set(r.branch, []);
      laneMap.get(r.branch).push({ s: r.start, e: r.end, ai: r.aiPct >= 50 });
    }

    daily[iso] = {
      hours: +(mins / 60).toFixed(1),
      mins,
      aiPct: mins ? Math.round((aiMinSum / mins) * 100) : 0,
      sessions: parents.length || list.length,
      subagents,
      prs: 0,
      peak,
      interrupts,
      tools,
      bars: list.map((r) => ({ s: r.start, e: r.end, ai: r.aiPct >= 50 })),
      intMins: list.flatMap((r) => r.interrupts.map((it) => {
        const [h, mm] = it.t.split(':').map(Number);
        return h * 60 + mm;
      })),
      lanes: [...laneMap.entries()].map(([name, ss]) => ({ name, sessions: ss })),
    };
  }

  // ---- weeks: exactly 13 (quarter), ending on today's week ----
  const weeks = [];
  const thisWeekStart = weekStart(todayDate);
  for (let i = 12; i >= 0; i--) {
    const ws = addDays(thisWeekStart, -i * 7);
    const dayCon = [0, 0, 0, 0, 0, 0, 0];
    const dayInt = [0, 0, 0, 0, 0, 0, 0];
    const tools = { read: 0, edit: 0, bash: 0, task: 0, grep: 0 };
    let hrMin = 0;
    let aiMinSum = 0;
    let peak = 0;
    const cellCounts = new Array(9).fill(0);
    for (let dz = 0; dz < 7; dz++) {
      const d = addDays(ws, dz);
      const iso = isoDate(d);
      const dd = daily[iso];
      const dayRich = byDay.get(iso) || [];
      if (dd) {
        hrMin += dd.mins;
        aiMinSum += Math.round((dd.aiPct / 100) * dd.mins);
        dayCon[dz] = dd.peak;
        dayInt[dz] = dd.interrupts;
        if (dd.peak > peak) peak = dd.peak;
      }
      for (const r of dayRich) {
        for (const t of r.raw.toolUses) tools[kindOf(t.name)] = (tools[kindOf(t.name)] || 0) + 1;
        cellCounts[r.cell] += 1;
      }
    }
    let type = 4;
    let max = -1;
    cellCounts.forEach((c, idx) => {
      if (c > max) {
        max = c;
        type = idx;
      }
    });
    weeks.push({
      w: isoWeek(ws),
      hr: +(hrMin / 60).toFixed(1),
      ai: hrMin ? +(aiMinSum / hrMin).toFixed(2) : 0,
      pr: 0,
      peak,
      type: max > 0 ? type : 4,
      label: `${ws.getMonth() + 1}/${ws.getDate()}`,
      dayCon,
      dayInt,
      tools,
    });
  }

  // ---- compass cell density ----
  const compass = new Array(9).fill(0);
  for (const r of rich) compass[r.cell] += 1;

  // ---- today AI vs manual + tool activity breakdown ----
  const todayRich = byDay.get(todayIso) || [];
  const aiSumAi = todayRich.reduce((a, r) => a + r.aiMin, 0);
  const aiSumMn = todayRich.reduce((a, r) => a + r.waitMin, 0);
  const toolMins = {};
  for (const r of todayRich) {
    for (const b of r.main) {
      const lbl = b.kind === 'read' ? 'Read · Grep' : b.kind === 'grep' ? 'Read · Grep' : b.kind[0].toUpperCase() + b.kind.slice(1);
      toolMins[lbl] = (toolMins[lbl] || 0) + (b.e - b.s);
    }
    for (const sa of r.subagents)
      toolMins.Task = (toolMins.Task || 0) + sa.tasks.reduce((x, t) => x + (t.e - t.s), 0);
  }
  const aiActivities = Object.entries(toolMins)
    .map(([label, mins]) => ({ label, mins }))
    .sort((a, b) => b.mins - a.mins)
    .slice(0, 5);
  const mnActivities = [{ label: '(待機時間・内訳取得不可)', mins: aiSumMn }];

  // ---- parData: today's concurrency across active window ----
  let parData = [];
  if (todayRich.length) {
    const lo = Math.min(...todayRich.map((r) => r.start));
    const hi = Math.max(...todayRich.map((r) => r.end));
    const buckets = Math.max(1, Math.min(24, Math.ceil((hi - lo) / 30)));
    const step = (hi - lo) / buckets;
    for (let i = 0; i < buckets; i++) {
      const m = lo + step * i + step / 2;
      parData.push(todayRich.filter((r) => r.start <= m && r.end > m).length);
    }
  }
  if (!parData.length) parData = [0];

  // ---- today stats cards ----
  const todayDaily = daily[todayIso] || { mins: 0, sessions: 0, subagents: 0, peak: 0, interrupts: 0 };
  const todayStats = [
    {
      label: '作業時間',
      value: `${Math.floor(todayDaily.mins / 60)}:${pad2(todayDaily.mins % 60)}`,
      unit: 'h',
      sub: `うち 実行 ${Math.floor(aiSumAi / 60)}:${pad2(aiSumAi % 60)} / 待機 ${Math.floor(aiSumMn / 60)}:${pad2(aiSumMn % 60)}`,
    },
    { label: 'セッション', value: String(todayDaily.sessions), unit: '件', sub: `subagent ${todayDaily.subagents}` },
    { label: '並列ピーク', value: String(todayDaily.peak), unit: '隻', sub: `中央 ${Math.round(parData.reduce((a, b) => a + b, 0) / parData.length)}` },
    { label: '中断', value: String(todayDaily.interrupts), unit: '件', sub: focalSessions.flatMap((s) => s.interrupts.map((i) => i.t)).join(' / ') || '—' },
  ];

  // ---- highlights (top moments from today) ----
  const highlights = [];
  const longest = [...todayRich].sort((a, b) => b.end - b.start - (a.end - a.start))[0];
  if (longest)
    highlights.push({ time: `${pad2(Math.floor(longest.start / 60))}:${pad2(longest.start % 60)}`, title: longest.title, kind: `最長セッション · ${longest.branch}` });
  if (todayRich.length)
    highlights.push({ time: '—', title: `並列 ${Math.max(...parData)} 件に達す`, kind: '計測点 · 並列ピーク' });
  const mostTools = [...todayRich].sort((a, b) => b.tools - a.tools)[0];
  if (mostTools && mostTools !== longest)
    highlights.push({ time: `${pad2(Math.floor(mostTools.start / 60))}:${pad2(mostTools.start % 60)}`, title: mostTools.title, kind: `tool 集中 · ${mostTools.tools} 回` });

  // ---- quarter stats ----
  const allActiveMin = rich.reduce((a, r) => a + r.aiMin, 0);
  const totalSubagents = rich.reduce((a, r) => a + r.subagents.length, 0);
  const totalInterrupts = rich.reduce((a, r) => a + r.interrupts.length, 0);
  const longestSession = [...rich].sort((a, b) => b.end - b.start - (a.end - a.start))[0];
  const longestWait = [...rich].sort((a, b) => b.waitMin - a.waitMin)[0];
  const avgPar = (rich.reduce((a, r) => a + r.overlap, 0) / rich.length).toFixed(1);
  const quarterStats = [
    { label: '総 AI 稼働', value: String(Math.round(allActiveMin / 60)), unit: 'h', sub: 'tool アクティブ時間' },
    { label: '最長集中', value: longestSession ? String(longestSession.end - longestSession.start) : '0', unit: '分', sub: longestSession ? longestSession.branch : '—' },
    { label: '最長中断', value: longestWait ? String(longestWait.waitMin) : '0', unit: '分', sub: longestWait ? longestWait.branch : '—' },
    { label: '平均並列度', value: avgPar, unit: '隻', sub: 'セッション重なり' },
    { label: 'Subagent', value: String(totalSubagents), unit: '回', sub: 'Task ツール起動' },
    { label: '中断', value: String(totalInterrupts), unit: '回', sub: 'queue.remove' },
  ];

  return {
    meta: {
      today: todayIso,
      generatedAt: new Date().toISOString(),
      project: project || null,
      projects: projectList,
      sessionCount: sessions.length,
    },
    todayStats,
    aiSumAi: aiSumAi || 0,
    aiSumMn: aiSumMn || 0,
    aiActivities: aiActivities.length ? aiActivities : [{ label: '(本日データなし)', mins: 0 }],
    mnActivities,
    parData,
    highlights,
    focalSessions,
    daily,
    weeks,
    compass,
    quarterStats,
  };
}
