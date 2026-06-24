export default function CompassScreen({ vm }) {
  return (
    <article data-screen-label="作業分布 / Compass" style={{ padding: '48px 48px 96px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 28, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 22, letterSpacing: '.06em', margin: 0 }}>作業分布</h2>
        <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '.04em' }}>Style Map</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.08em' }}>本週 (W26) のセッション 102 件 を集計</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gridTemplateRows: '1fr 60px', gap: 0, marginBottom: 48 }}>
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr 1fr', alignItems: 'center', paddingRight: 14, borderRight: '1px solid var(--color-border)' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, writingMode: 'vertical-rl', textAlign: 'center', letterSpacing: '.06em', color: 'var(--ink-2)' }}>AI 主導 <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)' }}>/ high</span></div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, writingMode: 'vertical-rl', textAlign: 'center', letterSpacing: '.06em', color: 'var(--ink-2)' }}>協働 <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)' }}>/ mid</span></div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, writingMode: 'vertical-rl', textAlign: 'center', letterSpacing: '.06em', color: 'var(--ink-2)' }}>自力中心 <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)' }}>/ low</span></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gap: 0, border: '1px solid var(--color-border)' }}>
          {vm.typeCells.map((c) => (
            <button key={c.i} onClick={c.select} style={{ background: c.bg, outline: c.outline, outlineOffset: '-1px', border: 'none', padding: '22px 18px', cursor: 'pointer', textAlign: 'left', color: c.labelColor, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160, fontFamily: 'inherit' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 9, letterSpacing: '.06em', opacity: .7 }}>{c.ai} · {c.par}</div>
                <div style={{ fontFamily: 'var(--font-family-body)', fontWeight: 700, fontSize: c.nameSize, letterSpacing: '.04em', marginTop: 8, lineHeight: 1.2 }}>{c.name}</div>
                <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, opacity: .75, marginTop: 2, letterSpacing: '.06em' }}>{c.en}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14 }}>
                <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 18, fontWeight: 500 }}>{c.density}</span>
                <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 9, opacity: .6, letterSpacing: '.1em' }}>件 · {c.intensityPct}%</span>
              </div>
            </button>
          ))}
        </div>
        <div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-family-body)', fontSize: 13, letterSpacing: '.06em', color: 'var(--ink-2)' }}>単一 <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)' }}>/ 1</span></div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-family-body)', fontSize: 13, letterSpacing: '.06em', color: 'var(--ink-2)' }}>2 セッション <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)' }}>/ 2</span></div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-family-body)', fontSize: 13, letterSpacing: '.06em', color: 'var(--ink-2)' }}>3+ セッション <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-3)' }}>/ 3+</span></div>
        </div>
      </div>
    </article>
  );
}
