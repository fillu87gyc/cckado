import { ToggleButton, IconOnlyButton, Button, FullScreenModal } from '@freee_jp/vibes';
import { MdChevronLeft, MdChevronRight, MdToday } from 'react-icons/md';

export default function LogScreen({ vm }) {
  return (
    <article data-screen-label="稼働ログ / Log" style={{ padding: '48px 48px 96px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 18, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 22, letterSpacing: '.06em', margin: 0 }}>稼働ログ</h2>
        <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '.04em' }}>The Logbook</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.08em' }}>{vm.headerDateLabel}</span>
      </div>

      {/* Day / Week / Month sub-nav + date navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, marginBottom: 28, padding: '14px 18px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-card)' }}>
        <div style={{ display: 'flex' }}>
          {vm.logViewItems.map((it) => (
            <ToggleButton
              key={it.value}
              type="radio"
              name="logView"
              value={it.value}
              small
              toggled={vm.logView === it.value}
              onChange={() => vm.onLogViewChange(it.value)}
            >
              {it.label}
            </ToggleButton>
          ))}
        </div>

        {vm.isLogDay && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconOnlyButton IconComponent={MdChevronLeft} label="前日へ" appearance="secondary" small onClick={vm.shiftDayPrev} />
            <div style={{ textAlign: 'center', minWidth: 200 }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{vm.dayLabel}</div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 16, fontWeight: 600, letterSpacing: '.02em', marginTop: 2 }}>{vm.dayLabelShort}</div>
            </div>
            <IconOnlyButton IconComponent={MdChevronRight} label="翌日へ" appearance="secondary" small disabled={vm.dayNextDisabled} onClick={vm.shiftDayNext} />
            <Button appearance="secondary" small IconComponent={MdToday} iconPosition="left" onClick={vm.shiftDayToToday}>本日へ</Button>
          </div>
        )}
        {vm.isLogWeek && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconOnlyButton IconComponent={MdChevronLeft} label="前週へ" appearance="secondary" small onClick={vm.shiftWeekPrev} />
            <div style={{ textAlign: 'center', minWidth: 200 }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{vm.weekRangeLabel}</div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 16, fontWeight: 600, letterSpacing: '.02em', marginTop: 2 }}>第{vm.weekLabel} 週</div>
            </div>
            <IconOnlyButton IconComponent={MdChevronRight} label="翌週へ" appearance="secondary" small disabled={vm.weekNextDisabled} onClick={vm.shiftWeekNext} />
          </div>
        )}
        {vm.isLogMonth && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconOnlyButton IconComponent={MdChevronLeft} label="前月へ" appearance="secondary" small onClick={vm.shiftMonthPrev} />
            <div style={{ textAlign: 'center', minWidth: 200 }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{vm.monthLabelEn}</div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 16, fontWeight: 600, letterSpacing: '.02em', marginTop: 2 }}>{vm.monthLabel}</div>
            </div>
            <IconOnlyButton IconComponent={MdChevronRight} label="翌月へ" appearance="secondary" small disabled={vm.monthNextDisabled} onClick={vm.shiftMonthNext} />
          </div>
        )}
      </div>

      {vm.isLogDay && <DayView vm={vm} />}
      {vm.isLogWeek && <WeekView vm={vm} />}
      {vm.isLogMonth && <MonthView vm={vm} />}
    </article>
  );
}

function DayView({ vm }) {
  return (
    <>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0, background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>作業時間</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.dayViewHours}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}> h</span></div>
          </div>
          <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>AI 比率</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.dayViewAiPct}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}> %</span></div>
          </div>
          <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>セッション</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.dayViewSessions}</div>
          </div>
          <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>ツール起動</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.dayViewTools}</div>
          </div>
          <div style={{ padding: '18px 16px' }}>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>中断</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.dayViewInterrupts}</div>
          </div>
        </div>
      </div>

      {vm.isNotToday && (
        <>
          <div style={{ marginBottom: 24, padding: 24, background: 'var(--bg-panel)', borderRadius: 'var(--radius-card)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 15, letterSpacing: '.02em', margin: 0 }}>当日の推移</h3>
              <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>09:00 → 19:00 · session blocks &amp; interrupt ticks</span>
            </div>
            <div style={{ position: 'relative', height: 64, borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', background: 'var(--bg-sink)' }}>
              {vm.weekHourTicks.map((h, i) => (
                <div key={i} style={{ position: 'absolute', left: h.leftPct, top: 0, bottom: 16, width: 1, background: 'var(--rule)', opacity: .6 }}></div>
              ))}
              {vm.viewedDayBars.map((b, i) => (
                <div key={i} style={{ position: 'absolute', left: b.leftPct, width: b.widthPct, top: 14, height: 22, background: b.bg, opacity: .9 }}></div>
              ))}
              {vm.viewedIntTicks.map((it, i) => (
                <div key={i} style={{ position: 'absolute', left: it.leftPct, top: 4, height: 30, width: 2, background: 'var(--interrupt)', transform: 'translateX(-50%)' }}></div>
              ))}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 14 }}>
                {vm.weekHourTicks.map((h, i) => (
                  <div key={i} style={{ position: 'absolute', left: h.leftPct, top: 0, transform: 'translateX(-50%)', fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{h.label}</div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-2)', letterSpacing: '.04em' }}>
                <span style={{ color: 'var(--ink-3)' }}>peak</span> {vm.dayViewPeak} <span style={{ color: 'var(--ink-3)' }}>隻</span>
                <span style={{ margin: '0 12px', color: 'var(--rule)' }}>/</span>
                <span style={{ color: 'var(--ink-3)' }}>PR</span> {vm.dayViewPrs}
                <span style={{ margin: '0 12px', color: 'var(--rule)' }}>/</span>
                <span style={{ color: 'var(--ink-3)' }}>subagent</span> {vm.dayViewSubagents}
              </div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>詳細セッションの再生は本日のみ可。過去日は概要のみ。</div>
            </div>
          </div>

          <div style={{ padding: '32px 24px', border: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--ink-3)' }}>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, letterSpacing: '.04em', marginBottom: 8 }}>ARCHIVED</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 14, letterSpacing: '.06em', lineHeight: 1.7 }}>
              メインスレッド × subagent の詳細記録は <span style={{ color: 'var(--accent)' }}>本日</span> の航海のみ展開可能。<br />過去の日は要約のみを保存しています。
            </div>
          </div>
        </>
      )}

      {vm.isToday_ && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid var(--rule)', marginBottom: 8 }}>
            {vm.branchRows.map((r) => (
              <button key={r.idx} onClick={r.select} style={{ display: 'block', width: '100%', padding: '18px 22px 14px', border: 'none', borderBottom: '1px solid var(--rule)', background: r.rowBg, cursor: 'pointer', textAlign: 'left', color: 'inherit', fontFamily: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 15, color: 'var(--ink)', letterSpacing: '.04em', fontWeight: 500 }}>{r.branch}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    {r.hasPR && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.04em' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--accent)', transform: 'rotate(45deg)' }}></span>
                        <span>#{r.prNum} {r.prStatus}</span>
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink-2)', letterSpacing: '.02em' }}>{r.tools}<span style={{ color: 'var(--ink-3)', marginLeft: 2 }}>▸</span></span>
                  </div>
                </div>

                <div style={{ position: 'relative', height: 48 }}>
                  {vm.dayHourTicks.map((h, i) => (
                    <div key={i} style={{ position: 'absolute', left: h.leftPct, top: 6, bottom: 18, width: 1, background: 'var(--rule)', opacity: .5 }}></div>
                  ))}
                  {r.isSelected && (
                    <div style={{ position: 'absolute', left: `calc(${r.leftPct} - 8px)`, width: `calc(${r.widthPct} + 16px)`, top: 8, bottom: 18, border: '1px solid var(--accent)', borderRadius: 14 }}></div>
                  )}
                  {r.dayBars.map((b, i) => (
                    <div key={i} style={{ position: 'absolute', left: b.leftPct, width: b.widthPct, top: 14, height: 14, background: 'var(--ai)', opacity: .85 }}></div>
                  ))}
                  {r.interruptTicks.map((it, i) => (
                    <div key={i} style={{ position: 'absolute', left: it.leftPct, top: 2, height: 14, width: 2, background: 'var(--interrupt)', transform: 'translateX(-50%)' }}></div>
                  ))}
                  {r.hasPR && (
                    <div style={{ position: 'absolute', left: r.prMarkerLeft, top: 14, width: 14, height: 14, background: 'var(--accent)', transform: 'translate(-50%,0) rotate(45deg)' }}></div>
                  )}
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 14 }}>
                    {vm.dayHourTicks.map((h, i) => (
                      <div key={i} style={{ position: 'absolute', left: h.leftPct, top: 0, transform: 'translateX(-50%)', fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{h.label}</div>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em' }}>
            <span>/ {vm.totalSessionsLabel} /</span>
            <span>BRANCHES</span>
            <span style={{ flex: 1, height: 1, background: 'var(--rule)' }}></span>
            <span style={{ letterSpacing: '.06em', color: 'var(--ink-3)' }}>クリックで詳細をモーダル表示</span>
          </div>

          <BranchActivityModal row={vm.branchRows.find((r) => r.isSelected)} />
        </>
      )}
    </>
  );
}

function BranchActivityModal({ row }) {
  if (!row) return null;
  const r = row;
  return (
    <FullScreenModal
      isOpen
      title={r.branch}
      headerSideContent={<span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{r.startLabel} — {r.endLabel} · {r.durLabel} · {r.tools} tools</span>}
      onRequestClose={r.deselect}
      shouldCloseOnEsc
    >
      <div style={{ padding: '4px 4px 28px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--ink)', alignSelf: 'center' }}></span>
            <h4 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 700, fontSize: 13, letterSpacing: '.04em', margin: 0, color: 'var(--ink)' }}>メインスレッド ／ subagent</h4>
            <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.08em' }}>flame stack on session timeline</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 110px', gap: 14, alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink)', letterSpacing: '.04em', textAlign: 'right' }}>メインスレッド</div>
              <div style={{ position: 'relative', height: 30, border: '1px solid var(--rule)', background: 'var(--bg)', overflow: 'hidden' }}>
                {r.phasesRich.map((p, i) => (
                  <div key={i} title={p.label} style={{ position: 'absolute', top: 0, bottom: 0, left: p.leftPct, width: p.widthPct, background: p.bg }}></div>
                ))}
                {r.interruptLocal.map((it, i) => (
                  <div key={i} style={{ position: 'absolute', left: it.leftPct, top: -3, bottom: -3, width: 2, background: 'var(--interrupt)', transform: 'translateX(-50%)', boxShadow: '0 0 0 1px var(--bg)' }}></div>
                ))}
              </div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{r.durLabel}</div>
            </div>

            {r.subRich.map((sa, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 110px', gap: 14, alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-2)', letterSpacing: '.04em' }}>↳ {sa.name}</div>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{sa.kindLabel}</div>
                </div>
                <div style={{ position: 'relative', height: 20 }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}></div>
                  {sa.tasksLocal.map((t, ti) => (
                    <div key={ti} style={{ position: 'absolute', top: 2, bottom: 2, left: t.leftPct, width: t.widthPct, background: t.bg }}></div>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.04em' }}>
                  <div>{sa.range}</div>
                  <div style={{ fontSize: 9 }}>{sa.durLabel}</div>
                </div>
              </div>
            ))}

            {r.noSubagents && (
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 110px', gap: 14, alignItems: 'center' }}>
                <div></div>
                <div style={{ padding: '8px 12px', border: '1px solid var(--color-border)', fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.08em', textAlign: 'center' }}>subagent 委譲なし</div>
                <div></div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 110px', gap: 14, marginTop: 6 }}>
            <div></div>
            <div style={{ position: 'relative', height: 14 }}>
              {r.mainLocalTicks.map((t, i) => (
                <div key={i} style={{ position: 'absolute', left: t.leftPct, top: 0, transform: 'translateX(-50%)', fontFamily: 'var(--font-family-body)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{t.label}</div>
              ))}
            </div>
            <div></div>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)', fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-2)', letterSpacing: '.04em' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 12, height: 10, background: 'var(--ai)' }}></span>
              <span>AI working <span style={{ color: 'var(--ink)' }}>{r.aiMin}<span style={{ color: 'var(--ink-3)' }}>min</span></span></span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 12, height: 10, background: 'color-mix(in oklab, var(--ai) 40%, var(--bg-panel))' }}></span>
              <span>explore <span style={{ color: 'var(--ink)' }}>{r.exploreMin}<span style={{ color: 'var(--ink-3)' }}>min</span></span></span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 12, height: 10, background: 'var(--human)' }}></span>
              <span>human wait <span style={{ color: 'var(--ink)' }}>{r.waitMin}<span style={{ color: 'var(--ink-3)' }}>min</span></span></span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 12, height: 10, background: 'var(--vb-s-07)' }}></span>
              <span>plan <span style={{ color: 'var(--ink)' }}>{r.planMin}<span style={{ color: 'var(--ink-3)' }}>min</span></span></span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--interrupt)' }}></span>
              <span>interrupt <span style={{ color: 'var(--ink)' }}>{r.interruptCount}</span></span>
            </span>
          </div>
        </div>

        {r.hasInterrupts && (
          <div style={{ paddingTop: 18, borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.08em', marginBottom: 10 }}>INTERRUPTS · {r.interruptCount}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {r.interrupts.map((it, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--accent-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--accent)', letterSpacing: '.04em' }}>{it.t}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FullScreenModal>
  );
}

function WeekView({ vm }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 0, background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>週合計 時間</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.weekTotals.hours}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}> h</span></div>
        </div>
        <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>平均 AI 比率</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.weekAvgAi}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}> %</span></div>
        </div>
        <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>セッション</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.weekTotals.sessions}</div>
        </div>
        <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>PR (マージ)</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.weekTotals.prs}</div>
        </div>
        <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>並列ピーク</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.weekTotals.peak}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}> 件</span></div>
        </div>
        <div style={{ padding: '18px 16px' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>中断</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.weekTotals.interrupts}</div>
        </div>
      </div>

      {/* § 1 — Branch concurrency flame stack */}
      <div style={{ marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <h3 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 15, letterSpacing: '.02em', margin: 0 }}>ブランチの並行稼働</h3>
            <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>main threads stacked · who ran in parallel with whom</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--ink-2)', letterSpacing: '.04em' }}>
            <span><span style={{ color: 'var(--ink-3)' }}>触ったブランチ </span><span style={{ color: 'var(--ink)', fontSize: 14 }}>{vm.weekBranchCount}</span></span>
            <span><span style={{ color: 'var(--ink-3)' }}>並列ピーク </span><span style={{ color: 'var(--accent)', fontSize: 14 }}>{vm.weekConcPeak}</span><span style={{ color: 'var(--ink-3)' }}> 本</span></span>
            <span><span style={{ color: 'var(--ink-3)' }}>平均並列 </span><span style={{ color: 'var(--ink)', fontSize: 14 }}>{vm.weekConcAvg}</span></span>
          </div>
        </div>

        <div style={{ position: 'relative', height: 46, border: '1px solid var(--color-border)', borderBottom: 'none', background: 'var(--bg-panel)' }}>
          {vm.weekDayCols.map((c, i) => (
            <div key={i} style={{ position: 'absolute', left: c.leftPct, width: c.widthPct, top: 0, bottom: 0, background: c.cellBg, borderRight: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 16, lineHeight: 1, color: c.labelColor }}>{c.dateNum}<span style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 400, marginLeft: 4 }}>{c.wd}</span></div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 8, color: 'var(--ink-3)', letterSpacing: '.04em', marginTop: 3 }}>09 — 19</div>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', height: 36, borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)', background: 'var(--bg-sink)' }}>
          {vm.weekDayCols.map((c, i) => (
            <div key={i} style={{ position: 'absolute', left: c.leftPct, width: c.widthPct, top: 0, bottom: 0, background: c.cellBg, borderRight: '1px solid var(--rule)' }}></div>
          ))}
          {vm.weekConcSamples.map((s, i) => (
            <div key={i} style={{ position: 'absolute', left: s.leftPct, width: s.widthPct, bottom: 0, height: s.heightPct, background: s.bg }}></div>
          ))}
          <div style={{ position: 'absolute', left: 6, top: 4, fontFamily: 'var(--font-family-body)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.08em' }}>並列度 / concurrency</div>
          <div style={{ position: 'absolute', right: 6, top: 4, fontFamily: 'var(--font-family-body)', fontSize: 9, color: 'var(--accent)', letterSpacing: '.08em' }}>peak {vm.weekConcPeak}</div>
        </div>

        <div style={{ border: '1px solid var(--color-border)', borderTop: 'none', background: 'var(--bg)' }}>
          {vm.weekBranchesRich.map((br, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 90px', gap: 0, alignItems: 'center', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ padding: '8px 12px', borderRight: '1px solid var(--rule)', background: 'var(--bg-panel)' }}>
                <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--ink)', letterSpacing: '.02em', fontWeight: 500 }}>{br.name}</div>
                <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.04em', marginTop: 2 }}>{br.distinctDays}日 · {br.sessionCount}ses</div>
              </div>
              <div style={{ position: 'relative', height: 28 }}>
                {vm.weekDayCols.map((c, ci) => (
                  <div key={ci} style={{ position: 'absolute', left: c.leftPct, width: c.widthPct, top: 0, bottom: 0, background: c.cellBg, borderRight: '1px solid var(--rule)' }}></div>
                ))}
                {br.bars.map((b, bi) => (
                  <div key={bi} style={{ position: 'absolute', left: b.leftPct, width: b.widthPct, top: 6, height: 16, background: b.bg, opacity: .9 }}></div>
                ))}
              </div>
              <div style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-2)', letterSpacing: '.04em', borderLeft: '1px solid var(--rule)' }}>
                {br.durLabel}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 14, height: 8, background: 'var(--ai)' }}></span>AI セッション</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 14, height: 8, background: 'var(--human)' }}></span>手動セッション</span>
          <span style={{ flex: 1, height: 1, background: 'var(--rule)' }}></span>
          <span>同じ時刻に複数の棒が重なる = 並列実行</span>
        </div>
      </div>

      {/* § 2 — Week day rows */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 15, letterSpacing: '.02em', margin: 0 }}>一週間の推移</h3>
        <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>each row is one day, 09:00 → 19:00 · click to drill in</span>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)' }}>
        {vm.weekDays.map((d, i) => (
          <button key={i} onClick={d.jumpToDay} style={{ display: 'grid', gridTemplateColumns: '80px 130px 1fr 110px', gap: 18, alignItems: 'start', width: '100%', padding: '16px 14px', border: 'none', borderBottom: '1px solid var(--rule)', background: d.rowBg, cursor: 'pointer', textAlign: 'left', color: 'inherit', fontFamily: 'inherit', opacity: d.opacity }}>
            <div style={{ paddingTop: 6 }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontWeight: 700, fontSize: 22, lineHeight: 1, letterSpacing: '.02em', color: d.labelColor }}>{d.dateNum}<span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 400, marginLeft: 4 }}>{d.wd}</span></div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '.04em' }}>{d.dateLabel}</div>
            </div>
            <div style={{ paddingTop: 6, fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.7, letterSpacing: '.02em' }}>
              <div>{d.hours}<span style={{ color: 'var(--ink-3)' }}>h</span> · {d.sessions}<span style={{ color: 'var(--ink-3)' }}>ses</span></div>
              <div>AI <span style={{ color: 'var(--ink)' }}>{d.aiPct}%</span> · int {d.interrupts}</div>
              <div><span style={{ color: 'var(--accent)' }}>並列</span> {d.dayConcPeak}<span style={{ color: 'var(--ink-3)' }}>本</span></div>
            </div>
            <div>
              <div style={{ position: 'relative', border: '1px solid var(--rule)', background: 'var(--bg-sink)' }}>
                {vm.weekHourTicks.map((h, hi) => (
                  <div key={hi} style={{ position: 'absolute', left: h.leftPct, top: 0, bottom: 0, width: 1, background: 'var(--rule)', opacity: .5, pointerEvents: 'none', zIndex: 2 }}></div>
                ))}
                {d.dayLanes.map((lane, li) => (
                  <div key={li} style={{ position: 'relative', height: 14, borderBottom: '1px solid color-mix(in oklab, var(--rule) 50%, transparent)' }}>
                    <span style={{ position: 'absolute', left: 6, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontFamily: 'var(--font-family-body)', fontSize: 8, color: 'var(--ink-3)', letterSpacing: '.02em', zIndex: 3, pointerEvents: 'none', textShadow: '0 0 3px var(--bg-sink), 0 0 3px var(--bg-sink)' }}>{lane.name}</span>
                    {lane.bars.map((b, bi) => (
                      <div key={bi} style={{ position: 'absolute', left: b.leftPct, width: b.widthPct, top: 2, height: 10, background: b.bg, opacity: .9, borderRadius: 1 }}></div>
                    ))}
                  </div>
                ))}
                {d.intTicks.map((it, ii) => (
                  <div key={ii} style={{ position: 'absolute', left: it.leftPct, top: 0, bottom: 0, width: 2, background: 'var(--interrupt)', transform: 'translateX(-50%)', zIndex: 4, pointerEvents: 'none' }}></div>
                ))}
              </div>
              <div style={{ position: 'relative', height: 14, marginTop: 2 }}>
                {vm.weekHourTicks.map((h, hi) => (
                  <div key={hi} style={{ position: 'absolute', left: h.leftPct, top: 0, transform: 'translateX(-50%)', fontFamily: 'var(--font-family-body)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{h.label}</div>
                ))}
              </div>
            </div>
            <div style={{ paddingTop: 6, fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'right', letterSpacing: '.04em', lineHeight: 1.7 }}>
              <div>peak {d.dayConcPeak} 件</div>
              <div><span style={{ color: 'var(--accent)' }}>▸ #{d.prs}</span> PR</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingTop: 14, fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--ai)' }}></span>AI セッション</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--human)' }}></span>手動セッション</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 2, height: 12, background: 'var(--interrupt)' }}></span>中断 (interrupt)</span>
        <span style={{ flex: 1, height: 1, background: 'var(--rule)' }}></span>
        <span>日付クリックで日次ビューへ ↗</span>
      </div>
    </>
  );
}

function MonthView({ vm }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 0, background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>月合計 時間</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.monthTotals.hours}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}> h</span></div>
        </div>
        <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>平均 AI 比率</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.monthAvgAi}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}> %</span></div>
        </div>
        <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>セッション</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.monthTotals.sessions}</div>
        </div>
        <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>PR (マージ)</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.monthTotals.prs}</div>
        </div>
        <div style={{ padding: '18px 16px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>中断</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.monthTotals.interrupts}</div>
        </div>
        <div style={{ padding: '18px 16px' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>稼動日</div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 30, lineHeight: 1, marginTop: 8 }}>{vm.monthTotals.activeDays}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 15, letterSpacing: '.02em', margin: 0 }}>カレンダー / {vm.monthLabel}</h3>
        <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>intensity bar = hours / 8h · dot = PR · click to drill in</span>
      </div>

      <div style={{ border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: 'var(--bg-panel)', borderBottom: '1px solid var(--color-border)' }}>
          {vm.monthCols.map((c, i) => (
            <div key={i} style={{ padding: '10px 0', textAlign: 'center', fontFamily: 'var(--font-family-body)', fontWeight: 500, fontSize: 12, color: 'var(--ink-2)', letterSpacing: '.04em', borderRight: '1px solid var(--rule)' }}>{c}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {vm.monthCells.map((c, i) => (
            <button key={i} onClick={c.jumpToDay} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6, minHeight: 96, padding: '10px 10px 8px', background: c.cellBg, border: 'none', borderRight: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', outline: c.outline, outlineOffset: '-1px', cursor: c.cursor, textAlign: 'left', color: 'inherit', fontFamily: 'inherit', opacity: c.opacity }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 18, letterSpacing: '.02em', color: c.textColor }}>{c.dateNum}</span>
                <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{c.hoursLabel}<span style={{ opacity: .6 }}>h</span></span>
              </div>
              <div style={{ flex: 1, position: 'relative', height: 34, background: 'var(--bg-sink)' }}>
                <div style={{ position: 'absolute', left: 0, bottom: 0, width: '60%', height: c.barHeight, background: 'var(--ai)', opacity: .7 }}></div>
                <div style={{ position: 'absolute', left: '60%', bottom: 0, width: '40%', height: c.aiBarWidth, background: 'var(--accent)', opacity: .5 }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-family-body)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.04em' }}>
                <span style={{ display: 'flex', gap: 3 }}>
                  {c.prDots.map((p, pi) => (
                    <span key={pi} style={{ display: 'inline-block', width: 6, height: 6, background: 'var(--accent)', transform: 'rotate(45deg)' }}></span>
                  ))}
                </span>
                <span>{c.sessions}<span style={{ opacity: .6 }}>s</span> · int {c.interrupts}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingTop: 14, fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 10, height: 12, background: 'var(--ai)', opacity: .7 }}></span>稼動時間</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 10, height: 12, background: 'var(--interrupt)', opacity: .5 }}></span>AI 比率</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--accent)', transform: 'rotate(45deg)' }}></span>PR</span>
        <span style={{ flex: 1, height: 1, background: 'var(--rule)' }}></span>
        <span>セルクリックで日次ビューへ ↗</span>
      </div>
    </>
  );
}
