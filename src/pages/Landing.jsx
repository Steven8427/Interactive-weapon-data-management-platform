import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';

function Landing() {
  const [stats, setStats] = useState({ codes: 0, streamers: 0, guns: 0, variants: 0 });
  const [hotCodes, setHotCodes] = useState([]);
  const [topStreamers, setTopStreamers] = useState([]);
  const [passwords, setPasswords] = useState([]);
  const [topMfg, setTopMfg] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [{ data: codes }, { data: pwData }, { data: mfgData }, { count: gunCount }, { count: variantCount }] = await Promise.all([
        supabase.from('official_gun_codes').select('*').order('apply_num', { ascending: false }).limit(6),
        supabase.from('daily_passwords').select('*').order('date', { ascending: false }).order('map_id').limit(5),
        supabase.from('manufacturing_items').select('*').order('profit', { ascending: false }).limit(4),
        supabase.from('guns').select('*', { count: 'exact', head: true }),
        supabase.from('gun_variants').select('*', { count: 'exact', head: true }),
      ]);
      setHotCodes(codes || []); setPasswords(pwData || []); setTopMfg(mfgData || []);
      const { data: allCodes } = await supabase.from('official_gun_codes').select('author_nickname, author_avatar, apply_num, like_num');
      const sMap = {};
      (allCodes || []).forEach(c => { const n = c.author_nickname; if (!n) return; if (!sMap[n]) sMap[n] = { name: n, avatar: c.author_avatar, count: 0, apply: 0 }; sMap[n].count++; sMap[n].apply += (c.apply_num || 0); });
      setTopStreamers(Object.values(sMap).sort((a, b) => b.apply - a.apply).slice(0, 8));
      setStats({ codes: (allCodes || []).length, streamers: Object.keys(sMap).length, guns: gunCount || 0, variants: variantCount || 0 });
      setLoading(false);
    }
    fetchAll();
  }, []);

  function copyCode(code) { navigator.clipboard.writeText(code).then(() => toast.success('改枪码已复制！')).catch(() => { const ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast.success('改枪码已复制！'); }); }
  function formatNum(n) { if (!n) return '0'; if (n >= 10000) return (n / 10000).toFixed(1) + 'w'; if (n >= 1000) return (n / 1000).toFixed(1) + 'k'; return String(n); }
  function formatPrice(n) { if (!n) return '-'; if (n >= 10000) return (n / 10000).toFixed(1) + 'w'; return n.toLocaleString(); }
  const PW_META = { '零号大坝': { icon: '🏗️', color: '#20e870' }, '长弓溪谷': { icon: '🏔️', color: '#18a0d0' }, '巴克什': { icon: '🏜️', color: '#e0a030' }, '航天基地': { icon: '🚀', color: '#d050d0' }, '潮汐监狱': { icon: '⛓️', color: '#e06040' } };

  if (loading) return <div className="loading"><div className="spinner"></div>加载中...</div>;

  return (
    <div>
      <SEO path="/" description="有力气的改枪网站 - 三角洲行动(Delta Force)最全工具站：官方热门改枪码、主播同款改枪码、玩家社区分享、每日密码查询、特勤处制造利润计算、物品价格走势图、卡战备推荐系统。" />
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '40px 20px 30px', background: 'linear-gradient(180deg, rgba(32,232,112,0.06) 0%, transparent 100%)', borderRadius: 16, marginBottom: 28 }}>
        <img src="/logo.png" alt="" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 12 }} onError={e => e.target.style.display = 'none'} />
        <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg, #20e870, #18a0d0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>有力气的改枪网站</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>改枪码 · 每日密码 · 制造利润 · 价格走势 · 卡战备</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {[{ label: '官方改枪码', value: stats.codes, color: '#20e870' }, { label: '官方主播', value: stats.streamers, color: '#18a0d0' }, { label: '自定义枪械', value: stats.guns, color: '#e0a030' }, { label: '改枪配置', value: stats.variants, color: '#d050d0' }].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}><div style={{ fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div></div>
          ))}
        </div>
      </div>

      {/* 快捷入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 28 }}>
        {[
          { to: '/streamers', icon: '🎙️', label: '主播改枪码', color: '#20e870' },
          { to: '/official', icon: '🔥', label: '官方热门', color: '#e06040' },
          { to: '/community', icon: '🌐', label: '玩家社区', color: '#d050d0' },
          { to: '/daily', icon: '🔑', label: '每日密码', color: '#18a0d0' },
          { to: '/profit', icon: '💰', label: '制造利润', color: '#e0a030' },
          { to: '/cards', icon: '🃏', label: '卡战备', color: '#4090f0' },
          { to: '/prices', icon: '📈', label: '价格走势', color: '#60c0c0' },
          { to: '/items', icon: '📖', label: '物品图鉴', color: '#c060e0' },
        ].map(item => (
          <Link key={item.to} to={item.to} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 10px', textAlign: 'center', textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.color}50`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
          </Link>
        ))}
      </div>

      {/* 今日密码 */}
      {passwords.length > 0 && (<div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><h2 style={{ fontSize: 18, fontWeight: 700 }}>🔑 今日密码</h2><Link to="/daily" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>查看全部 →</Link></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
          {passwords.map(pw => { const m = PW_META[pw.map_name] || { icon: '🗺️', color: '#20e870' }; return (
            <div key={pw.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{m.icon}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{pw.map_name}</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 900, color: m.color, letterSpacing: 3 }}>{pw.secret}</div>
            </div>); })}
        </div>
      </div>)}

      {/* 热门主播 */}
      {topStreamers.length > 0 && (<div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><h2 style={{ fontSize: 18, fontWeight: 700 }}>🎙️ 热门主播</h2><Link to="/streamers" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>查看全部 →</Link></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {topStreamers.map(s => (
            <Link key={s.name} to="/streamers" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 12px', textAlign: 'center', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(32,232,112,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
              {s.avatar ? <img src={s.avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)', marginBottom: 8 }} />
              : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(32,232,112,0.1)', border: '2px solid var(--accent)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.name.charAt(0)}</div>}
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.count}方案 · {formatNum(s.apply)}使用</div>
            </Link>
          ))}
        </div>
      </div>)}

      {/* 热门改枪码 */}
      {hotCodes.length > 0 && (<div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><h2 style={{ fontSize: 18, fontWeight: 700 }}>🔥 热门改枪码</h2><Link to="/official" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>查看全部 →</Link></div>
        <div style={{ display: 'grid', gap: 10 }}>
          {hotCodes.map((code, idx) => (
            <div key={code.id} onClick={() => copyCode(code.solution_code)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(32,232,112,0.3)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: idx < 3 ? 'rgba(224,160,48,0.15)' : 'var(--bg-secondary)', border: `1px solid ${idx < 3 ? 'rgba(224,160,48,0.3)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, color: idx < 3 ? '#e0a030' : 'var(--text-muted)' }}>{idx + 1}</div>
              {code.arms_pic && <img src={code.arms_pic} alt="" style={{ width: 52, height: 38, objectFit: 'contain', borderRadius: 6, background: 'linear-gradient(135deg, #1a2a3a, #1e3040)', border: '1px solid var(--border)', padding: 2, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{code.author_nickname} · {formatPrice(code.price)}</div></div>
              <div style={{ fontSize: 14, color: '#e0a030', fontWeight: 700, fontFamily: "'Orbitron', monospace", flexShrink: 0 }}>{formatNum(code.apply_num)}</div>
            </div>
          ))}
        </div>
      </div>)}

      {/* 今日最赚 */}
      {topMfg.length > 0 && (<div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><h2 style={{ fontSize: 18, fontWeight: 700 }}>💰 今日最赚</h2><Link to="/profit" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>查看全部 →</Link></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {topMfg.map(item => (
            <Link key={item.id} to="/profit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, textDecoration: 'none', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(32,232,112,0.3)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>{item.item_image && <img src={item.item_image} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, background: 'linear-gradient(135deg, #1a2a3a, #1e3040)' }} onError={e => e.target.style.display = 'none'} />}<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item_name}</div></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.place_name} · {item.period}h</span><span style={{ fontSize: 17, fontWeight: 900, color: '#20e870', fontFamily: "'Orbitron', monospace" }}>+{formatPrice(item.profit)}</span></div>
            </Link>
          ))}
        </div>
      </div>)}
    </div>
  );
}

export default Landing;