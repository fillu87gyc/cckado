import { PageTitle } from '@freee_jp/vibes';
import { MdAnalytics, MdChevronRight } from 'react-icons/md';

export default function IndexScreen({ vm }) {
  return (
    // vibes-audit: article ラッパは padding 64/48/96px・maxWidth 1280px と固定。
    // vibes Container は幅が narrow/normal/wide(=640/1120/1600px) の離散値で 1280px に一致せず、
    // padding 指定 API も無く <main> を二重に挿入しうるため、レイアウト枠は素の article で残す。
    <article data-screen-label="目次・序 / Index" style={{ padding: '64px 48px 96px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 64, alignItems: 'end', paddingBottom: 40, borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-input)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* 生の <span class="material-icons"> を react-icons へ移行 (vibes MaterialIcon と同じ Md アイコン系・App.jsx と統一)。これで Material Icons の自前 @font-face 依存を解消。 */}
              <MdAnalytics size={24} color="var(--bg-card)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 17, fontWeight: 700, letterSpacing: '.02em', color: 'var(--ink)', lineHeight: 1 }}>稼働ログ</div>
              <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.14em', textTransform: 'uppercase' }}>Activity Log</div>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 13, letterSpacing: '.06em', color: 'var(--accent)' }}>W26 / 2026.06.19 (Fri)</div>
          {/* ページ見出しを vibes PageTitle (<h1>) へ移行。vibes 既定の 24px になるため
             元の 32px/字間は失われる (= design 多少変化, vibes 優先)。併記の "Week 26" は
             PageTitle が字間/サイズ混在を表現できないため子要素として素 span のまま添える。 */}
          <PageTitle>
            第26週<span style={{ fontFamily: 'var(--font-family-body)', fontWeight: 500, fontSize: 14, color: 'var(--ink-3)', marginLeft: 14, letterSpacing: '.02em' }}>Week 26</span>
          </PageTitle>
        </div>
        {/* vibes-audit: 罫線付きサマリ欄。11px/16px 混在の数値・字間・左罫線レイアウトは
           vibes Text(固定4サイズ・字間不可) や DescriptionList の体裁では再現できない。 */}
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
        {/* vibes-audit: 目次の行ボタン。number / 和欧タイトル / chevron を 60px・1fr・auto の
           3 カラムで組む独自レイアウトで、vibes の ListButton や TableListRow ではこの
           グリッド構造・22px の番号・字間を表現できない。chevron だけ react-icons に統一。 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 56px' }}>
          {vm.tocItems.map((t) => (
            <button key={t.num} onClick={t.go} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 24, padding: '24px 0', borderBottom: '1px solid var(--rule)', background: 'transparent', borderLeft: 'none', borderRight: 'none', borderTop: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit', fontFamily: 'inherit', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-family-body)', fontSize: 22, color: 'var(--accent)', letterSpacing: '.04em' }}>{t.num}</span>
              <span>
                <span style={{ display: 'block', fontFamily: 'var(--font-family-body)', fontWeight: 600, fontSize: 22, letterSpacing: '.08em', marginBottom: 6 }}>{t.jp}</span>
                <span style={{ display: 'block', fontFamily: 'var(--font-family-body)', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '.08em' }}>{t.en}</span>
              </span>
              <MdChevronRight size={20} color="var(--ink-3)" style={{ alignSelf: 'center' }} />
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
