import { useActivityLog } from './logic/useActivityLog.js';
import IndexScreen from './screens/IndexScreen.jsx';
import TodayScreen from './screens/TodayScreen.jsx';
import LogScreen from './screens/LogScreen.jsx';
import CompassScreen from './screens/CompassScreen.jsx';
import QuarterScreen from './screens/QuarterScreen.jsx';

function App() {
  const vm = useActivityLog();

  return (
    <div data-screen-label="稼働ログ / Activity Log" style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: 'var(--font-family-body)' }}>
      {/* MASTHEAD */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--rule)', padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-icons-outlined" style={{ fontSize: 24, color: 'var(--accent)' }}>analytics</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 18, fontWeight: 700, letterSpacing: '.02em', color: 'var(--ink)' }}>稼働ログ</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--ink-3)', letterSpacing: '.04em' }}>Activity Log</div>
          </div>
        </div>
        <div style={{ height: 20, width: 1, background: 'var(--rule)' }}></div>
        <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--ink-2)', letterSpacing: '.02em' }}>
          2026 Q2 · W26 · 6/19 (Fri)
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--ink-3)' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--vb-gr-05)' }}></span>
            記録中
          </span>
        </div>
      </header>

      {/* NAV / TOC */}
      <nav style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--rule)', padding: '0 32px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {vm.navItems.map((n, i) => (
          <button key={i} onClick={n.go} style={{ background: n.tabBg, color: n.tabColor, border: 'none', padding: '0 18px', height: 42, marginTop: 6, marginBottom: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-family-body)', fontSize: 13, fontWeight: n.tabWeight, borderRadius: 'var(--radius-input) var(--radius-input) 0 0', letterSpacing: '.02em', transition: 'background-color .2s, color .2s' }}>
            <span className="material-icons-outlined" style={{ fontSize: 16, opacity: n.iconOpacity }}>{n.icon}</span>
            <span>{n.jp}</span>
            <span style={{ fontSize: 11, opacity: .65, letterSpacing: '.04em' }}>{n.en}</span>
          </button>
        ))}
      </nav>

      {vm.isIndex && <IndexScreen vm={vm} />}
      {vm.isToday && <TodayScreen vm={vm} />}
      {vm.isLog && <LogScreen vm={vm} />}
      {vm.isCompass && <CompassScreen vm={vm} />}
      {vm.isQuarter && <QuarterScreen vm={vm} />}
    </div>
  );
}

export default App;
