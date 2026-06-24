export default function QuarterScreen({ vm }) {
  return (
    <article data-screen-label="四半期推移 / Quarter" style={{ padding: '48px 48px 96px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 28, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 22, letterSpacing: '.06em', margin: 0 }}>四半期推移</h2>
        <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '.04em' }}>Quarterly Report</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.08em' }}>2026 Q2 · W14 → W26</span>
      </div>

      {/* Interactive scrub chart */}
      <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-family-body)', fontSize: 18, fontWeight: 600, letterSpacing: '.06em', margin: 0 }}>週次の推移 · 時間 と AI 比率</h3>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '.06em' }}>⇽ 横軸をドラッグして週を選ぶ ⇾  下のヒートマップ・型遷移・ツール構成すべて連動</div>
          </div>
          <div style={{ display: 'flex', gap: 24, fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--ink-3)' }}>
            <span><span style={{ display: 'inline-block', width: 14, height: 6, background: 'var(--accent)', opacity: .18, verticalAlign: 'middle', marginRight: 6 }}></span>時間 (h)</span>
            <span><span style={{ display: 'inline-block', width: 14, borderTop: '1.5px dashed var(--sea)', verticalAlign: 'middle', marginRight: 6 }}></span>AI 比率 (%)</span>
            <span><span style={{ display: 'inline-block', width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', verticalAlign: 'middle', marginRight: 6 }}></span>マージ (PR)</span>
          </div>
        </div>
        <div onPointerDown={vm.onScrubDown} style={{ cursor: 'ew-resize', touchAction: 'none', userSelect: 'none' }}>
          <svg viewBox={`0 0 ${vm.cW} ${vm.cH}`} style={{ width: '100%', height: 'auto', overflow: 'visible', fontFamily: 'var(--font-family-body)', display: 'block' }}>
            <line x1="50" y1={vm.chartBaseline} x2="970" y2={vm.chartBaseline} stroke="var(--ink)" strokeWidth="1" />
            {vm.hrAxisLabels.map((g, i) => (
              <g key={i}>
                <line x1="50" y1={g.y} x2="970" y2={g.y} stroke="var(--rule)" strokeWidth=".5" strokeDasharray="2 4" />
                <text x="44" y={g.y} textAnchor="end" fontSize="10" fill="var(--ink-3)" dominantBaseline="middle" letterSpacing=".06em">{g.v}h</text>
              </g>
            ))}
            {vm.aiAxisLabels.map((g, i) => (
              <text key={i} x="976" y={g.y} fontSize="10" fill="var(--sea)" dominantBaseline="middle" letterSpacing=".06em">{g.v}%</text>
            ))}
            <path d={vm.hrArea} fill="var(--accent)" opacity=".14" />
            <path d={vm.hrPath} stroke="var(--accent)" strokeWidth="1.5" fill="none" />
            <path d={vm.aiPath} stroke="var(--sea)" strokeWidth="1.2" fill="none" strokeDasharray="4 2" />
            {vm.chartPoints.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.hrY} r="2.5" fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.2" />
                <text x={p.x} y={vm.chartBaseline} dy="14" textAnchor="middle" fontSize="9" fill="var(--ink-3)" letterSpacing=".04em">{p.label}</text>
                {p.prDots.map((d, j) => (
                  <circle key={j} cx={p.x} cy={d.y} r="1.8" fill="var(--accent)" />
                ))}
              </g>
            ))}
            {vm.chartAnnotations.map((a, i) => (
              <g key={i}>
                <line x1={a.x} y1={a.y1} x2={a.x} y2="14" stroke="var(--ink-3)" strokeWidth=".5" strokeDasharray="1 2" />
                <text x={a.x} y="10" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontSize="10" fill="var(--ink-2)" letterSpacing=".06em">{a.label}</text>
              </g>
            ))}
            <g>
              <line x1={vm.scrubX} y1="20" x2={vm.scrubX} y2={vm.chartBaseline} stroke="var(--ink)" strokeWidth="1.2" />
              <circle cx={vm.scrubX} cy={vm.scrubHrY} r="6" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
              <circle cx={vm.scrubX} cy={vm.scrubAiY} r="4.5" fill="var(--bg)" stroke="var(--sea)" strokeWidth="1.6" />
            </g>
          </svg>
        </div>
      </div>

      {/* Scrubbed week card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: 0, background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', marginBottom: 48 }}>
        <div style={{ padding: '24px 28px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.06em' }}>SELECTED WEEK</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 10 }}>
            <h3 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 700, fontSize: 54, letterSpacing: '.02em', margin: 0, lineHeight: 1 }}>{vm.scrubWeekLabel}</h3>
            <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink-3)' }}>週開始 {vm.scrubWeekDate}</span>
          </div>
        </div>
        <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, alignContent: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 28, lineHeight: 1, letterSpacing: '-.02em' }}>{vm.scrubWeekHr}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}>h</span></div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '.04em' }}>作業時間</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 28, lineHeight: 1, letterSpacing: '-.02em' }}>{vm.scrubWeekAi}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}>%</span></div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '.04em' }}>AI 比率</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 28, lineHeight: 1, letterSpacing: '-.02em' }}>{vm.scrubWeekPr}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}>隻</span></div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '.04em' }}>マージ (PR)</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 28, lineHeight: 1, letterSpacing: '-.02em' }}>{vm.scrubWeekPeak}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}>隻</span></div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '.04em' }}>並列ピーク</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 28, lineHeight: 1, letterSpacing: '-.02em' }}>{vm.scrubWeekToolTotal}</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '.04em' }}>ツール起動</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 28, lineHeight: 1, letterSpacing: '-.02em' }}>{vm.scrubWeekInterrupts}</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '.04em' }}>中断 (週合計)</div>
          </div>
        </div>
      </div>

      {/* 2 Heatmaps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48, paddingBottom: 32, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--sea)', letterSpacing: '.06em' }}>FIG. I</div>
              <h3 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 18, letterSpacing: '.06em', margin: '4px 0 0' }}>並列セッションの濃淡 / 週 × 曜日</h3>
            </div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>peak {vm.maxCon} 件</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(7, 1fr)', gap: 2 }}>
            <div></div>
            {vm.dayLabels.map((d, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', paddingBottom: 4, letterSpacing: '.04em' }}>{d}</div>
            ))}
            {vm.heatRows.map((r, ri) => (
              <>
                <div key={`l${ri}`} style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', textAlign: 'right', paddingRight: 6, alignSelf: 'center', letterSpacing: '.04em' }}>{r.label}</div>
                {r.cellsCon.map((c, ci) => (
                  <div key={`c${ri}-${ci}`} style={{ aspectRatio: '1', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-family-body)', fontSize: 10, color: c.textColor, letterSpacing: '.04em', outline: c.outline, outlineOffset: '-1px' }}>{c.v}</div>
                ))}
              </>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.06em' }}>FIG. II</div>
              <h3 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 18, letterSpacing: '.06em', margin: '4px 0 0' }}>中断 (interrupt) の密度 / 週 × 曜日</h3>
            </div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>peak {vm.maxInt} 件/日</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(7, 1fr)', gap: 2 }}>
            <div></div>
            {vm.dayLabels.map((d, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', paddingBottom: 4, letterSpacing: '.04em' }}>{d}</div>
            ))}
            {vm.heatRows.map((r, ri) => (
              <>
                <div key={`l${ri}`} style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', textAlign: 'right', paddingRight: 6, alignSelf: 'center', letterSpacing: '.04em' }}>{r.label}</div>
                {r.cellsInt.map((c, ci) => (
                  <div key={`c${ri}-${ci}`} style={{ aspectRatio: '1', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-family-body)', fontSize: 10, color: c.textColor, letterSpacing: '.04em', outline: c.outline, outlineOffset: '-1px' }}>{c.v}</div>
                ))}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Type trajectory */}
      <div style={{ marginBottom: 48, paddingBottom: 32, borderBottom: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.06em' }}>FIG. III</div>
            <h3 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 18, letterSpacing: '.06em', margin: '4px 0 0' }}>型の遷移 / 13週分の型推移</h3>
          </div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>13 weeks</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 6 }}>
          {vm.trajRibbonRich.map((t, i) => (
            <div key={i} style={{ padding: '10px 8px 12px', background: t.bg, border: t.border, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{t.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, margin: '8px auto 8px', width: 18, height: 18 }}>
                {t.miniCells.map((c, ci) => (
                  <div key={ci} style={{ background: c.bg }}></div>
                ))}
              </div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, fontWeight: 500, color: 'var(--ink)', letterSpacing: '.04em', lineHeight: 1.3 }}>{t.typeName}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tool mix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 48, marginBottom: 48, paddingBottom: 32, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.06em' }}>FIG. IV</div>
            <h3 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 18, letterSpacing: '.06em', margin: '4px 0 0' }}>ツール構成 / どのツールで何を進めたか</h3>
          </div>
          <div style={{ position: 'relative', height: 220, borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            {vm.toolBars.map((b, i) => (
              <div key={i} style={{ flex: 1, position: 'relative', height: '100%' }}>
                {b.segs.map((seg, si) => (
                  <div key={si} style={{ position: 'absolute', left: 0, right: 0, bottom: seg.bottom, height: seg.height, background: seg.color }}></div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {vm.toolBars.map((b, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-family-body)', fontSize: 9, color: b.labelColor, letterSpacing: '.04em' }}>{b.label}</div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em', marginBottom: 14 }}>Q2 合計の構成</div>
          {vm.totalToolMix.map((t) => (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '12px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, background: t.color }}></span>
              <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, letterSpacing: '.04em' }}>{t.label}</span>
              <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink-2)' }}>{t.pct}<span style={{ fontSize: 9, color: 'var(--ink-3)' }}>%</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Appendix stats */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.06em' }}>APPENDIX</div>
          <h3 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 18, letterSpacing: '.06em', margin: '4px 0 0' }}>付録 · Q2 を読み解く六つの数字</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 0, borderTop: '1.5px solid var(--color-border)', borderBottom: '1.5px solid var(--color-border)' }}>
          {vm.quarterStats.map((q) => (
            <div key={q.label} style={{ padding: '20px 16px', borderRight: '1px solid var(--rule)' }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>{q.label}</div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 32, lineHeight: 1, marginTop: 10, letterSpacing: '-.02em' }}>{q.value}<span style={{ fontSize: 13, color: 'var(--ink-3)' }}> {q.unit}</span></div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5, letterSpacing: '.02em' }}>{q.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
