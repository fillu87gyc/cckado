// Personality classification (PRD §4) mapped onto the matrix actually used by
// the UI: rows = engagement (AI主導 / 協働 / 自力中心), cols = concurrency
// (単一 / 2セッション / 3+). cellIndex = row*3 + col.

const clamp01 = (x) => Math.max(0, Math.min(1, x));

// Count parentUuid discontinuities = a user turn whose parent isn't the most
// recent node, a proxy for an interrupt / re-steer.
function parentBreaks(events) {
  let breaks = 0;
  let lastUuid = null;
  for (const e of events) {
    if (e.type === 'user' && e.parentUuid && lastUuid && e.parentUuid !== lastUuid) breaks++;
    if (e.uuid) lastUuid = e.uuid;
  }
  return breaks;
}

export function engagementScore(s) {
  const users = s.userMsgs || 0;
  const asst = s.assistantMsgs || 0;
  if (users === 0 && asst === 0) return 0;
  const autoRatio = users ? s.autoUsers / users : 0;
  const interruptRatio = users ? (parentBreaks(s.events) + s.queueRemoves) / users : 0;
  const toolsPerTurn = asst ? s.toolUses.length / asst : 0;
  return 0.5 * autoRatio - 0.3 * interruptRatio + 0.2 * clamp01(toolsPerTurn / 5);
}

// 0 = AI主導 (auto-pilot), 1 = 協働, 2 = 自力中心 (step-by-step)
export function engagementRow(s1) {
  if (s1 > 0.6) return 0;
  if (s1 < -0.2) return 2;
  return 1;
}

// 0 = 単一, 1 = 2セッション, 2 = 3+ (from peak concurrent sessions in the window)
export function concurrencyCol(overlap) {
  if (overlap <= 1) return 0;
  if (overlap <= 2) return 1;
  return 2;
}

export function cellIndex(row, col) {
  return row * 3 + col;
}
