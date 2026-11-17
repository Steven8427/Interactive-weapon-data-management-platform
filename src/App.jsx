import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import { useT, LanguageSwitcher } from './i18n';

// Route-level code splitting: each page's JS downloads only when opened
// (the home page stays in the main bundle for the fastest first paint).
const Admin = lazy(() => import('./pages/Admin'));
const DailyPassword = lazy(() => import('./pages/DailyPassword'));
const Manufacturing = lazy(() => import('./pages/Manufacturing'));
const PriceTrend = lazy(() => import('./pages/PriceTrend'));
const MapTool = lazy(() => import('./pages/MapTool'));
const Loadout = lazy(() => import('./pages/Loadout'));
const OfficialCodes = lazy(() => import('./pages/OfficialCodes'));
const Streamers = lazy(() => import('./pages/Streamers'));
const Community = lazy(() => import('./pages/Community'));
const Legal = lazy(() => import('./pages/Legal'));
const ItemCatalog = lazy(() => import('./pages/ItemCatalog'));
const GunLanding = lazy(() => import('./pages/GunLanding'));

const PageFallback = () => <div className="loading"><div className="spinner"></div></div>;

function App() {
  const location = useLocation();
  const { t } = useT();
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { path: '/', icon: '🏠', label: t('首页') },
    { path: '/streamers', icon: '🎙️', label: t('主播同款改枪码') },
    { path: '/official', icon: '🔥', label: t('官方热门改枪码') },
    { path: '/gun', icon: '🔫', label: t('武器改枪码大全') },
    { path: '/community', icon: '🌐', label: t('玩家社区') },
    { path: '/daily', icon: '🔑', label: t('每日密码') },
    { path: '/profit', icon: '💰', label: t('特勤处制造利润') },
    { path: '/prices', icon: '📈', label: t('价格走势图') },
    { path: '/items', icon: '📖', label: t('物品图鉴') },
    { path: '/cards', icon: '🃏', label: t('卡战备系统') },
    { path: '/map', icon: '🗺️', label: t('官方地图工具') },
    { path: '/admin', icon: '⚙️', label: t('管理后台') },
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
              <span className="sidebar-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        {!sidebarCollapsed && (
          <div style={{ padding: '0 12px 10px' }}>
            <LanguageSwitcher dropUp fullWidth />
          </div>
        )}
        <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          {sidebarCollapsed ? '▶' : '◀'}
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