import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import DailyPassword from './pages/DailyPassword';
import Manufacturing from './pages/Manufacturing';
import PriceTrend from './pages/PriceTrend';
import MapTool from './pages/MapTool';
import Loadout from './pages/Loadout';
import OfficialCodes from './pages/OfficialCodes';
import Streamers from './pages/Streamers';
import Community from './pages/Community';
import Legal from './pages/Legal';
import ItemCatalog from './pages/ItemCatalog';
import { useT, LanguageSwitcher } from './i18n';

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
            <img src="/logo.png" alt="logo" className="sidebar-logo-img" onError={e => { e.target.style.display = 'none'; }} />
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
            <img src="/logo.png" alt="" style={{ height: 26, width: 26, objectFit: 'contain', borderRadius: 4 }} onError={e => { e.target.style.display = 'none'; }} />
            <span>{t('有力气的改枪网站')}</span>
          </Link>
          <LanguageSwitcher />
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/streamers" element={<Streamers />} />
            <Route path="/official" element={<OfficialCodes />} />
            <Route path="/community" element={<Community />} />
            <Route path="/daily" element={<DailyPassword />} />
            <Route path="/profit" element={<Manufacturing />} />
            <Route path="/prices" element={<PriceTrend />} />
            <Route path="/items" element={<ItemCatalog />} />
            <Route path="/cards" element={<Loadout />} />
            <Route path="/map" element={<MapTool />} />
            <Route path="/admin" element={<Admin isAdmin={isAdmin} setIsAdmin={setIsAdmin} />} />
            <Route path="/legal" element={<Legal />} />
          </Routes>
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