import { TabBar, StatusIcon } from '@freee_jp/vibes';
import { MdAnalytics, MdMenuBook, MdToday, MdListAlt, MdDonutSmall, MdInsights } from 'react-icons/md';
import { useActivityLog } from './logic/useActivityLog.js';
import IndexScreen from './screens/IndexScreen.jsx';
import TodayScreen from './screens/TodayScreen.jsx';
import LogScreen from './screens/LogScreen.jsx';
import CompassScreen from './screens/CompassScreen.jsx';
import QuarterScreen from './screens/QuarterScreen.jsx';

const navIconComponents = {
  menu_book: MdMenuBook,
  today: MdToday,
  list_alt: MdListAlt,
  donut_small: MdDonutSmall,
  insights: MdInsights,
};

function App() {
  const vm = useActivityLog();

  return (
    <div data-screen-label="稼働ログ / Activity Log" style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: 'var(--font-family-body)' }}>
      {/* MASTHEAD */}
      {/* vibes-audit: アプリ固有のプロダクトヘッダー。vibes はグローバルナビ部品
         (GlobalNaviButton 等) は持つが、ロゴ＋和欧併記タイトル＋日付＋ステータスを
         この比率で並べる Header コンポーネントは無い。タイトルの 18px/12px や字間も
         Text の固定サイズ外なので header 自体は素の markup で残す。 */}
      <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--rule)', padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MdAnalytics size={24} color="var(--accent)" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            {/* vibes-audit: 18px は vibes Text(12/14/16/24px)に無いサイズ＋字間指定不可のため素テキスト。 */}
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 18, fontWeight: 700, letterSpacing: '.02em', color: 'var(--ink)' }}>稼働ログ</div>
            <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--ink-3)', letterSpacing: '.04em' }}>Activity Log</div>
          </div>
        </div>
        {/* vibes-audit: 縦罫線。vibes に Divider/区切り線コンポーネントが存在しないため 1px の div で描画。 */}
        <div style={{ height: 20, width: 1, background: 'var(--rule)' }}></div>
        <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 12, color: 'var(--ink-2)', letterSpacing: '.02em' }}>
          2026 Q2 · W26 · 6/19 (Fri)
        </div>
        {/* 「記録中」の状態表示は vibes StatusIcon に移行 (自前の緑ドット+ラベルを置換)。
           type="progress" は記録継続中を表す琥珀のステータスピル。design は多少変わる。 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusIcon type="progress">記録中</StatusIcon>
        </div>
      </header>

      {/* NAV / TOC */}
      <TabBar
        currentTabIndex={vm.currentNavIndex}
        onClickTab={(i) => vm.navItems[i].go()}
        tabs={vm.navItems.map((n) => {
          const Icon = navIconComponents[n.icon];
          return {
            name: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon size={16} style={{ opacity: n.iconOpacity }} />
                <span>{n.jp}</span>
                <span style={{ fontSize: 11, opacity: .65, letterSpacing: '.04em' }}>{n.en}</span>
              </span>
            ),
          };
        })}
      />

      {vm.isIndex && <IndexScreen vm={vm} />}
      {vm.isToday && <TodayScreen vm={vm} />}
      {vm.isLog && <LogScreen vm={vm} />}
      {vm.isCompass && <CompassScreen vm={vm} />}
      {vm.isQuarter && <QuarterScreen vm={vm} />}
    </div>
  );
}

export default App;
