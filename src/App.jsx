import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import { useT, LanguageSwitcher } from './i18n';
import {
  IconHome, IconMicrophone2, IconFlame, IconTarget, IconUsers, IconKey, IconCoin,
  IconChartLine, IconBook2, IconCards, IconMap2, IconSettings, IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react';

// Route-level code splitting: each page's JS downloads only when opened
// (the home page stays in the main bundle for the fastest first paint).
// After a new deploy the old chunk files are gone, so a tab opened before the
// deploy would fail to load the next page ("Loading chunk … failed"). In that
// case reload once to pick up the new build instead of showing a blank page.
const RELOAD_FLAG = 'chunk-reload';
function lazyPage(factory) {
  return lazy(() => factory().then(mod => {
    try { sessionStorage.removeItem(RELOAD_FLAG); } catch (e) { /* ignore */ }
    return mod;
  }, err => {
    let reloaded = false;
    try { reloaded = !!sessionStorage.getItem(RELOAD_FLAG); } catch (e) { /* ignore */ }
    if (/ChunkLoadError|Loading (CSS )?chunk|dynamically imported module/i.test(String(err && (err.name + ' ' + err.message))) && !reloaded) {
      try { sessionStorage.setItem(RELOAD_FLAG, '1'); } catch (e) { /* ignore */ }
      window.location.reload();
      return new Promise(() => {}); // keep the fallback until the reload happens
    }
    throw err;
  }));
}
const Admin = lazyPage(() => import('./pages/Admin'));
const DailyPassword = lazyPage(() => import('./pages/DailyPassword'));
const Manufacturing = lazyPage(() => import('./pages/Manufacturing'));
const PriceTrend = lazyPage(() => import('./pages/PriceTrend'));
const MapTool = lazyPage(() => import('./pages/MapTool'));
const Loadout = lazyPage(() => import('./pages/Loadout'));
const OfficialCodes = lazyPage(() => import('./pages/OfficialCodes'));
const Streamers = lazyPage(() => import('./pages/Streamers'));
const Community = lazyPage(() => import('./pages/Community'));
const Legal = lazyPage(() => import('./pages/Legal'));
const ItemCatalog = lazyPage(() => import('./pages/ItemCatalog'));
const GunLanding = lazyPage(() => import('./pages/GunLanding'));

const PageFallback = () => <div className="loading"><div className="spinner"></div></div>;

function App() {
  const location = useLocation();
  const { t } = useT();
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { path: '/', Icon: IconHome, label: t('首页') },
    { path: '/streamers', Icon: IconMicrophone2, label: t('主播同款改枪码') },
    { path: '/official', Icon: IconFlame, label: t('官方热门改枪码') },
    { path: '/gun', Icon: IconTarget, label: t('武器改枪码大全') },
    { path: '/community', Icon: IconUsers, label: t('玩家社区') },
    { path: '/daily', Icon: IconKey, label: t('每日密码') },
    { path: '/profit', Icon: IconCoin, label: t('特勤处制造利润') },
    { path: '/prices', Icon: IconChartLine, label: t('价格走势图') },
    { path: '/items', Icon: IconBook2, label: t('物品图鉴') },
    { path: '/cards', Icon: IconCards, label: t('卡战备系统') },
    { path: '/map', Icon: IconMap2, label: t('官方地图工具') },
    { path: '/admin', Icon: IconSettings, label: t('管理后台') },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 2000, style: { background: '#0c1a2a', color: '#d0e8f0', border: '1px solid #1a3048' } }} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" onClick={() => setSidebarOpen(false)}>
            <img src="/logo-64.png" alt="logo" className="sidebar-logo-img" onError={e => { e.target.style.display = 'none'; }} />
            {!sidebarCollapsed && <span className="sidebar-logo-text">{t('有力气的改枪')}</span>}
          </Link>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? item.label : ''}>
              <span className="sidebar-icon"><item.Icon size={19} stroke={1.75} /></span>
              {!sidebarCollapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        {!sidebarCollapsed && (
          <div style={{ padding: '0 12px 10px' }}>
            <LanguageSwitcher dropUp fullWidth />
          </div>
        )}
        <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? t('展开侧边栏') : t('收起侧边栏')}>
          {sidebarCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
        </button>
      </aside>
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span></span><span></span><span></span>
          </button>
          <Link to="/" className="topbar-logo">
            <img src="/logo-64.png" alt="" style={{ height: 26, width: 26, objectFit: 'contain', borderRadius: 4 }} onError={e => { e.target.style.display = 'none'; }} />
            <span>{t('有力气的改枪网站')}</span>
          </Link>
          <LanguageSwitcher />
        </header>
        <main className="main-content">
          <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/streamers" element={<Streamers />} />
            <Route path="/official" element={<OfficialCodes />} />
            <Route path="/community" element={<Community />} />
            <Route path="/daily" element={<DailyPassword />} />
            <Route path="/profit" element={<Manufacturing />} />
            <Route path="/prices" element={<PriceTrend />} />
            <Route path="/items" element={<ItemCatalog />} />
            <Route path="/gun" element={<GunLanding />} />
            <Route path="/gun/:slug" element={<GunLanding />} />
            <Route path="/cards" element={<Loadout />} />
            <Route path="/map" element={<MapTool />} />
            <Route path="/admin" element={<Admin isAdmin={isAdmin} setIsAdmin={setIsAdmin} />} />
            <Route path="/legal" element={<Legal />} />
          </Routes>
          </Suspense>
        </main>
        <footer style={{
          borderTop: '1px solid var(--border)', padding: '16px 28px',
          display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <Link to="/legal?tab=privacy" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>{t('隐私政策')}</Link>
          <Link to="/legal?tab=terms" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>{t('使用条款')}</Link>
          <Link to="/legal?tab=cookie" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>{t('Cookie 政策')}</Link>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>© 2026 YufanTechs</span>
        </footer>
      </div>
    </>
  );
}

export default App;