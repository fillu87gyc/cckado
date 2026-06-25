// Turn one session's raw JSONL records into a normalized, ordered model that the
// aggregator can consume without knowing the on-disk shape.

const lineCount = (str) => (str ? String(str).split('\n').length : 0);

// AI line delta contributed by an editing tool_use (PRD §4 / F02 approximation).
function toolLineDelta(name, input) {
  if (!input) return 0;
  if (name === 'Write') return lineCount(input.content);
  if (name === 'Edit') return lineCount(input.new_string);
  if (name === 'NotebookEdit') return lineCount(input.new_source);
  if (name === 'MultiEdit' && Array.isArray(input.edits))
    return input.edits.reduce((a, e) => a + lineCount(e.new_string), 0);
  return 0;
}

const ts = (r) => (r.timestamp ? new Date(r.timestamp) : null);

export function normalizeSession(records) {
  const recs = records
    .map((r) => ({ r, t: ts(r) }))
    .filter((x) => x.t || x.r.type) // keep typed records even if timeless
    .sort((a, b) => (a.t?.getTime() || 0) - (b.t?.getTime() || 0));

  // Session-level meta: take the first record carrying it.
  const metaSrc = records.find((r) => r.cwd) || {};
  const sessionId = (records.find((r) => r.sessionId) || {}).sessionId || null;
  const cwd = metaSrc.cwd || null;
  const gitBranch = metaSrc.gitBranch || null;
  const slug = (records.find((r) => r.slug) || {}).slug || null;
  const bridgeId = (records.find((r) => r.bridgeSessionId) || {}).bridgeSessionId || null;

  // Classify the session kind (PRD §3 "並列 Agent の識別").
  let kind = 'parent';
  if (bridgeId && String(bridgeId).startsWith('cse_')) kind = 'remote';
  else if (records.some((r) => r.isSidechain === true)) kind = 'sidechain';
  else if (cwd && /--claude-worktrees-/.test(cwd)) kind = 'worktree';

  // Timeline of timestamped events + extract tool_use spans.
  const timed = recs.filter((x) => x.t);
  const events = [];
  const toolUses = [];
  let userMsgs = 0;
  let assistantMsgs = 0;
  let autoUsers = 0;
  let queueRemoves = 0;
  let aiLines = 0;
  const interrupts = [];
  const firstPrompts = [];

  // First text prompt -> session title fallback.
  for (const { r } of timed) {
    if (r.type === 'user' && r.message) {
      const c = r.message.content;
      if (typeof c === 'string') firstPrompts.push(c);
      else if (Array.isArray(c)) {
        const txt = c.find((p) => p.type === 'text');
        if (txt?.text) firstPrompts.push(txt.text);
      }
    }
    if (firstPrompts.length) break;
  }

  for (let i = 0; i < timed.length; i++) {
    const { r, t } = timed[i];
    const nextT = timed[i + 1]?.t || t;
    events.push({ ts: t, type: r.type, parentUuid: r.parentUuid, uuid: r.uuid });

    if (r.type === 'user') {
      userMsgs++;
      if (r.permissionMode === 'auto') autoUsers++;
    } else if (r.type === 'assistant') {
      assistantMsgs++;
      const content = r.message?.content;
      if (Array.isArray(content)) {
        const tus = content.filter((p) => p.type === 'tool_use');
        // Each tool_use shares the assistant->next-event span, split evenly.
        const span = Math.max(0, nextT.getTime() - t.getTime());
        const each = tus.length ? span / tus.length : 0;
        tus.forEach((tu, j) => {
          const ld = toolLineDelta(tu.name, tu.input);
          aiLines += ld;
          toolUses.push({
            name: tu.name,
            input: tu.input || {},
            id: tu.id,
            start: new Date(t.getTime() + each * j),
            end: new Date(t.getTime() + each * (j + 1)),
            lineDelta: ld,
          });
        });
      }
    } else if (r.type === 'queue-operation' && r.operation === 'remove') {
      queueRemoves++;
      interrupts.push({ ts: t, msg: (r.content || '').slice(0, 120) });
    }
  }

  const firstTs = timed[0]?.t || null;
  const lastTs = timed[timed.length - 1]?.t || null;

  return {
    sessionId,
    cwd,
    gitBranch,
    slug,
    kind,
    isSidechain: kind === 'sidechain',
    firstTs,
    lastTs,
    events,
    toolUses,
    userMsgs,
    assistantMsgs,
    autoUsers,
    queueRemoves,
    aiLines,
    interrupts,
    title: slug || (firstPrompts[0] ? firstPrompts[0].slice(0, 60) : sessionId),
  };
}
