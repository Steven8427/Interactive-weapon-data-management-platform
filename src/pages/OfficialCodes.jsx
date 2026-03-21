import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useCachedData } from '../dataCache';
import SEO from '../components/SEO';

const CAT_COLOR = {"突击步枪":"#30d060","战斗步枪":"#e0a030","射手步枪":"#50b0e0","冲锋枪":"#d050d0","机枪":"#e06030","狙击步枪":"#4090f0","连狙":"#60c0c0","霰弹枪":"#d04040","手枪":"#a0a0a0","弓弩":"#90d040"};
const SLOT_NAME = { "1":"弹匣", "2":"枪口", "3":"下挂/握把", "5":"枪托", "6":"瞄具", "8":"激光指示器", "11":"护木", "17":"导轨配件", "20":"导轨配件", "32":"导轨配件", "34":"导轨配件", "35":"导轨配件", "44":"弹鼓" };

function OfficialCodes() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('全部');
  const [sortBy, setSortBy] = useState('apply');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = useCallback(async () => {
    const [{ data: codesData }, { data: itemsData }] = await Promise.all([
      supabase.from('official_gun_codes').select('*').neq('is_hidden', true).order('sort_order'),
      supabase.from('game_items').select('object_id, object_name, pic, avg_price, grade'),
    ]);
    const map = {};
    (itemsData || []).forEach(i => { map[i.object_id] = i; });
    return { codes: codesData || [], itemsMap: map, lastSync: codesData?.[0]?.synced_at || '' };
  }, []);

  const [data, loading] = useCachedData('official_codes', fetchData);
  const codes = data?.codes || [];
  const itemsMap = data?.itemsMap || {};
  const lastSync = data?.lastSync || '';

  const categories = useMemo(() => {
    const s = new Set(); codes.forEach(c => { if (c.arms_category) s.add(c.arms_category); });
    return ['全部', ...Array.from(s).sort()];
  }, [codes]);

  const filtered = useMemo(() => {
    let r = codes;
    if (filterCat !== '全部') r = r.filter(c => c.arms_category === filterCat);
    if (search.trim()) { const s = search.toLowerCase(); r = r.filter(c => c.name.toLowerCase().includes(s) || c.arms_name?.toLowerCase().includes(s) || c.author_nickname?.toLowerCase().includes(s)); }
    if (sortBy === 'apply') r = [...r].sort((a, b) => (b.apply_num || 0) - (a.apply_num || 0));
    if (sortBy === 'like') r = [...r].sort((a, b) => (b.like_num || 0) - (a.like_num || 0));
    if (sortBy === 'price_asc') r = [...r].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === 'price_desc') r = [...r].sort((a, b) => (b.price || 0) - (a.price || 0));
    return r;
  }, [codes, filterCat, search, sortBy]);

  function copyCode(code, e) { if (e) e.stopPropagation(); navigator.clipboard.writeText(code).then(() => toast.success('改枪码已复制！')).catch(() => { const ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast.success('改枪码已复制！'); }); }
  function formatNum(n) { if (!n) return '0'; if (n >= 10000) return (n/10000).toFixed(1) + 'w'; if (n >= 1000) return (n/1000).toFixed(1) + 'k'; return n.toString(); }
  function formatPrice(n) { if (!n) return '-'; if (n >= 10000) return (n/10000).toFixed(1) + 'w'; return n.toLocaleString(); }
  function formatTime(ts) { if (!ts) return ''; const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }

  function getAccessories(code) {
    try {
      const acc = typeof code.accessory === 'string' ? JSON.parse(code.accessory) : code.accessory;
      if (!Array.isArray(acc)) return [];
      return acc.map(a => {
        const item = itemsMap[a.objectID];
        const slotName = SLOT_NAME[String(a.slotID)] || `插槽${a.slotID}`;
        // Use game_items if available, otherwise construct image URL
        const pic = item?.pic || `https://playerhub.df.qq.com/playerhub/60004/object/${a.objectID}.png`;
        return {
          objectID: a.objectID,
          slotID: a.slotID,
          slotName,
          name: item?.object_name || slotName,
          pic,
          price: item?.avg_price || 0,
          grade: item?.grade || 0,
          hasData: !!item,
        };
      });
    } catch { return []; }
  }

  if (loading) return <div className="loading"><div className="spinner"></div>加载官方改枪码...</div>;

  return (
    <div>
      <SEO title="官方热门改枪码" path="/official" description="三角洲行动官方社区热门改枪码，按使用量排行，含完整配件列表和价格。" />
      <h1 className="page-title">🔥 官方热门改枪码</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        来自官方社区 · {codes.length} 个方案 · 点击展开查看配件 · 同步：{formatTime(lastSync)}
      </p>

      <div className="filter-bar">
        {categories.map(c => <button key={c} className={`filter-chip ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>{c}</button>)}
      </div>

      <div className="search-row">
        <div className="search-bar"><span className="search-icon">🔍</span><input placeholder="搜索枪名、方案名、作者..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="apply">使用量 高→低</option>
          <option value="like">点赞 高→低</option>
          <option value="price_asc">价格 低→高</option>
          <option value="price_desc">价格 高→低</option>
        </select>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map((code, idx) => {
          const catC = CAT_COLOR[code.arms_category] || '#20e870';
          const isExpanded = expandedId === code.id;
          const accessories = isExpanded ? getAccessories(code) : [];

          return (
            <div key={code.id} style={{
              background: 'var(--bg-card)', border: `1px solid ${isExpanded ? catC + '40' : 'var(--border)'}`,
              borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
            }}>
              <div onClick={() => setExpandedId(isExpanded ? null : code.id)} style={{ padding: '14px 16px', cursor: 'pointer' }}
                onMouseEnter={e => { if (!isExpanded) e.currentTarget.parentElement.style.borderColor = `${catC}50`; }}
                onMouseLeave={e => { if (!isExpanded) e.currentTarget.parentElement.style.borderColor = 'var(--border)'; }}>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: idx < 3 ? `${catC}20` : 'var(--bg-secondary)', border: `1px solid ${idx < 3 ? catC + '40' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, color: idx < 3 ? catC : 'var(--text-muted)' }}>{idx + 1}</div>
                  {code.arms_pic && <img src={code.arms_pic} alt="" style={{ width: 56, height: 40, objectFit: 'contain', borderRadius: 6, background: 'linear-gradient(135deg, #1a2a3a, #1e3040)', border: '1px solid var(--border)', padding: 2, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, flexWrap: 'wrap' }}>
                      <span style={{ padding: '1px 6px', borderRadius: 6, background: `${catC}15`, color: catC, border: `1px solid ${catC}30`, fontWeight: 600 }}>{code.arms_category}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatPrice(code.price)}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e0a030', fontFamily: "'Orbitron', monospace" }}>{formatNum(code.apply_num)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatNum(code.like_num)} 赞</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 13 }}>
                  {code.author_avatar && <img src={code.author_avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />}
                  <span style={{ color: 'var(--text-secondary)' }}>{code.author_nickname}</span>
                  {code.author_comment && <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>· {code.author_comment}</span>}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div onClick={e => copyCode(code.solution_code, e)} style={{ flex: 1, fontFamily: "'Courier New', monospace", fontSize: 12, color: 'var(--accent)', background: 'rgba(32,232,112,0.04)', border: '1px solid rgba(32,232,112,0.1)', borderRadius: 6, padding: '6px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code.solution_code}</div>
                  <span style={{ fontSize: 18, color: 'var(--text-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                </div>
              </div>

              {/* 展开配件详情 */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${catC}25`, padding: '14px 16px', background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>🔧 配件列表 ({accessories.length})</div>

                  {accessories.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>此方案无配件数据</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                      {accessories.map((acc, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
                          <img src={acc.pic} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, background: 'linear-gradient(135deg, #1a2a3a, #1e3040)', border: '1px solid var(--border)', padding: 2, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{acc.slotName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={e => copyCode(code.solution_code, e)} className="btn btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>📋 复制改枪码</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)' }}>
        💡 点击卡片展开查看配件详情。点击改枪码直接复制。数据每6小时自动同步。
      </div>
    </div>
  );
}

export default OfficialCodes;