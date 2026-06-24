export default function IndexScreen({ vm }) {
  return (
    <article data-screen-label="目次・序 / Index" style={{ padding: '64px 48px 96px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 64, alignItems: 'end', paddingBottom: 40, borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-input)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-icons-outlined" style={{ fontSize: 24, color: 'var(--bg-card)' }}>analytics</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 17, fontWeight: 700, letterSpacing: '.02em', color: 'var(--ink)', lineHeight: 1 }}>稼働ログ</div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.14em', textTransform: 'uppercase' }}>Activity Log</div>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, letterSpacing: '.06em', color: 'var(--accent)' }}>W26 / 2026.06.19 (Fri)</div>
          <h1 style={{ fontFamily: 'var(--font-family-body)', fontWeight: 700, fontSize: 32, lineHeight: 1.3, letterSpacing: '.02em', margin: '8px 0 0', color: 'var(--ink)' }}>
            第26週<span style={{ fontFamily: 'var(--font-family-body)', fontWeight: 500, fontSize: 14, color: 'var(--ink-3)', marginLeft: 14, letterSpacing: '.02em' }}>Week 26</span>
          </h1>
        </div>
        <aside style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-2)', letterSpacing: '.04em', lineHeight: 1.9, borderLeft: '1px solid var(--rule)', padding: '6px 0 6px 22px' }}>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.06em', marginBottom: 10 }}>TODAY · 6/19 (Fri)</div>
          <div>本日 <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 16, color: 'var(--ink)' }}>6h 42m</span></div>
          <div>AI 比率 <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 16, color: 'var(--ink)' }}>67%</span></div>
          <div>並列ピーク <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 16, color: 'var(--ink)' }}>4 件</span></div>
          <div>セッション <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 16, color: 'var(--ink)' }}>5 件</span></div>
          <div>中断 <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 16, color: 'var(--ink)' }}>6 件</span></div>
        </aside>
      </div>

      <div style={{ marginTop: 48 }}>
        <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--accent)', letterSpacing: '.06em', marginBottom: 24 }}>TABLE OF CONTENTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 56px' }}>
          {vm.tocItems.map((t) => (
            <button key={t.num} onClick={t.go} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 24, padding: '24px 0', borderBottom: '1px solid var(--rule)', background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit', fontFamily: 'inherit', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 22, color: 'var(--accent)', letterSpacing: '.04em' }}>{t.num}</span>
              <span>
                <span style={{ display: 'block', fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 22, letterSpacing: '.08em', marginBottom: 6 }}>{t.jp}</span>
                <span style={{ display: 'block', fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '.08em' }}>{t.en}</span>
              </span>
              <span className="material-icons-outlined" style={{ fontSize: 20, color: 'var(--ink-3)', alignSelf: 'center' }}>chevron_right</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid var(--rule)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 11, color: 'var(--ink-2)', letterSpacing: '.04em' }}>並列 avg 2.3 / peak 4 · AI 67% · 中断 6</div>
      </div>
    </article>
  );
}
