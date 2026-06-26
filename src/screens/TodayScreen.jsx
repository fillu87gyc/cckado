import { SectionTitle, SubSectionTitle } from '@freee_jp/vibes';

export default function TodayScreen({ vm }) {
  return (
    // vibes-audit: 画面枠 (padding/maxWidth 1280px) は vibes Container の離散幅に合わず素 article。
    <article data-screen-label="本日 / Today" style={{ padding: '48px 48px 96px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 28, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
        {/* 見出しを vibes SectionTitle (<h2>) へ移行 (22px→既定16px, design 多少変化を許容)。 */}
        <SectionTitle>本日</SectionTitle>
        <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '.04em' }}>Today's Edition</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.08em' }}>2026.06.19 (Fri)</span>
      </div>

      {/* vibes-audit: 統計ストリップ。背景/角丸/影は vibes CardBase 相当だが、CardBase は
         内側に固定 24px padding を挿入するため「端まで届く罫線区切りのセル」を表現できない
         (セルごとに padding と borderRight を持つ設計が崩れる)。数値も 36px と vibes Text 外。
         よってカード見た目は維持しつつ素の grid で残す。 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', marginBottom: 48 }}>
        {vm.todayStats.map((stat) => (
          <div key={stat.label} style={{ padding: '24px 22px', borderRight: '1px solid var(--rule)' }}>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 36, lineHeight: 1, marginTop: 10, letterSpacing: '-.02em' }}>
              {stat.value}<span style={{ fontSize: 13, color: 'var(--ink-3)' }}> {stat.unit}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5, letterSpacing: '.02em' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* § 1 — Tool-active time vs idle/non-tool time */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          {/* 小見出しを vibes SubSectionTitle (<h3>) へ移行。 */}
          <SubSectionTitle>ツール実行時間と待機時間の配分</SubSectionTitle>
          <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--ink-3)' }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--accent)', verticalAlign: 'middle', marginRight: 6 }}></span>ツール実行 {vm.aiPct}% · {vm.aiHours}h {vm.aiMins}m</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--sea)', verticalAlign: 'middle', marginRight: 6 }}></span>待機 {vm.mnPct}% · {vm.mnHours}h {vm.mnMins}m</span>
            <span style={{ fontFamily: 'var(--font-family-body)', color: 'var(--ink-2)' }}>total 6h 42m · 402 min</span>
          </div>
        </div>

        {/* vibes-audit: AI/人手の時間配分を 1 本の帯で示す stacked proportion bar。
           各セグメント幅が分単位の実データに比例し、内部にラベルを敷き詰める可視化で、
           vibes に比率バー/スタックバー部品は無いため flex+% で自前描画する。 */}
        <div style={{ position: 'relative', height: 64, display: 'flex', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ width: vm.aiBarWidthPct, height: '100%', display: 'flex', background: 'var(--accent)' }}>
            {vm.aiActsRich.map((a, i) => (
              <div key={i} style={{ flex: a.pctOfSideNum, borderRight: '1px solid color-mix(in oklab, var(--accent) 60%, var(--ink))', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', overflow: 'hidden' }}>
                <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--bg)', letterSpacing: '.04em', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{a.durLabel}</span>
              </div>
            ))}
          </div>
          <div style={{ width: vm.mnBarWidthPct, height: '100%', display: 'flex', background: 'var(--sea)' }}>
            {vm.mnActsRich.map((a, i) => (
              <div key={i} style={{ flex: a.pctOfSideNum, borderRight: '1px solid color-mix(in oklab, var(--sea) 60%, var(--ink))', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', overflow: 'hidden' }}>
                <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--bg)', letterSpacing: '.04em', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{a.durLabel}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', height: 24, marginTop: 4 }}>
          {vm.minAxisTicks.map((t, i) => (
            <div key={i} style={{ position: 'absolute', left: t.leftPct, top: 0, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 1, height: 5, background: 'var(--ink-3)' }}></div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.04em', marginTop: 3 }}>{t.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `${vm.aiBarWidthPct} ${vm.mnBarWidthPct}`, gap: 0, marginTop: 18, borderTop: '1px solid var(--rule)' }}>
          <div style={{ borderRight: '1px solid var(--color-border)', padding: '16px 18px 4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent)' }}></span>
              <div style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 13, letterSpacing: '.08em' }}>ツールが実行中だった時間</div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>{vm.aiHours}h {vm.aiMins}m / {vm.aiPct}%</div>
            </div>
            {vm.aiActsRich.map((a, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '8px 0', borderTop: '1px solid var(--color-border)', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontWeight: 500, fontSize: 13, letterSpacing: '.04em', lineHeight: 1.4 }}>{a.label}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink)', letterSpacing: '.04em' }}>{a.durLabel}</div>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{a.pctOfSideNum}%</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 0 4px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--sea)' }}></span>
              <div style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 13, letterSpacing: '.08em' }}>ツール非実行（待機・応答生成など）</div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>{vm.mnHours}h {vm.mnMins}m / {vm.mnPct}%</div>
            </div>
            {vm.mnActsRich.map((a, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '8px 0', borderTop: '1px solid var(--color-border)', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, letterSpacing: '.04em', lineHeight: 1.4, color: 'var(--ink-3)' }}>{a.label}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink)', letterSpacing: '.04em' }}>{a.durLabel}</div>
                  <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{a.pctOfSideNum}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* § 2 — Parallel sessions */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          {/* 小見出しを vibes SubSectionTitle (<h3>) へ移行。 */}
          <SubSectionTitle>並列セッション (件数 · 30 分刻み)</SubSectionTitle>
          <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--ink-3)' }}>avg {vm.parAvg} 件 / peak {vm.maxPar} 件</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 32, alignItems: 'start' }}>
          <div>
            {/* vibes-audit: 並列度の棒グラフ＋階段状の上端線＋peak 注記を SVG で描画。
               vibes にチャート/グラフ描画コンポーネントは存在しないため SVG 直書きのみ。 */}
            <svg viewBox={`0 0 ${vm.parChartW} ${vm.parChartH}`} style={{ width: '100%', height: 'auto', fontFamily: 'var(--font-family-body)', display: 'block' }}>
              {vm.parYAxis.map((y, i) => (
                <g key={i}>
                  <line x1="28" y1={y.y} x2="392" y2={y.y} stroke={y.stroke} strokeWidth={y.strokeWidth} strokeDasharray={y.dasharray} />
                  <text x="22" y={y.y} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="var(--ink-2)" letterSpacing=".04em">{y.v}</text>
                </g>
              ))}
              {vm.parBars.map((b, i) => (
                <g key={i}>
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--sea)" opacity=".85" />
                  <line x1={b.topX1} y1={b.topY} x2={b.topX2} y2={b.topY} stroke="var(--ink)" strokeWidth="1.2" />
                </g>
              ))}
              <g>
                <circle cx={vm.parPeakBar.topX1} cy={vm.parPeakBar.topY} r="3" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.2" />
                <text x={vm.parPeakBar.topX1} y={vm.parPeakBar.topY} dx="6" dy="-4" fontSize="9" fill="var(--accent)" letterSpacing=".06em">peak {vm.maxPar}</text>
              </g>
              {vm.parXAxis.map((x, i) => (
                <text key={i} x={x.x} y={vm.parChartH} dy="-4" textAnchor="middle" fontSize="9" fill="var(--ink-3)" letterSpacing=".04em">{x.t}</text>
              ))}
            </svg>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '.04em', textAlign: 'center' }}>時刻 (h) · 各バーは 30 分単位、上端は離散値の階段線</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em', marginBottom: 10 }}>並列度の分布</div>
            {vm.parDist.map((d) => (
              <div key={d.level} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 48px', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 14, color: 'var(--sea)' }}>{d.level}</span>
                <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.04em' }}>{d.count} 区間 ({d.pct}%)</span>
                <span style={{ display: 'block', height: 6, background: `color-mix(in oklab, var(--sea) ${d.pct}%, var(--bg-panel))` }}></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
