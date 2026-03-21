import React, { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useCachedData } from '../dataCache';
import SEO from '../components/SEO';

const TIERS = [
  { key: '11w', name: '大坝、长弓机密', budget: '11W', color: '#20e870' },
  { key: '18w', name: '巴克什、航天机密', budget: '18W', color: '#18a0d0' },
  { key: '24w', name: '潮汐监狱-适应', budget: '24W', color: '#e0a030' },
  { key: '55w', name: '巴克什-绝密', budget: '55W', color: '#e08040' },
  { key: '60w', name: '航天基地-绝密', budget: '60W', color: '#e06040' },
  { key: '78w', name: '潮汐监狱-绝密', budget: '78W', color: '#d050d0' },
];

const GRADE_COLORS = { 7:'#e04848', 6:'#e04848', 5:'#ffc040', 4:'#c060e0', 3:'#40a0e0', 2:'#40d070', 1:'#c0c8d0', 0:'#6898b0' };
const SC = { '枪械拉满':'#e04848', '均衡套装':'#20e870', '胸挂拉满':'#d050d0', '轻装跑图':'#18a0d0' };
const SI = { '枪械拉满':'🔫', '均衡套装':'⚖️', '胸挂拉满':'🦺', '轻装跑图':'🏃' };

function Loadout() {
  const [selectedTier, setSelectedTier] = useState('11w');
  const [viewMode, setViewMode] = useState('strategy');
  const [expandedId, setExpandedId] = useState(null);

  const fetchPresets = useCallback(async () => {
    const { data } = await supabase.from('loadout_presets').select('*').order('sort_order');
    return data || [];
  }, []);

  const [rawPresets, loading] = useCachedData('loadout_presets', fetchPresets);
  const presets = rawPresets || [];
  const lastUpdate = presets[0]?.updated_at || '';

  const fmtP = n => (!n && n !== 0) ? '-' : '$' + n.toLocaleString();
  const fmtW = n => { if (!n) return '-'; if (n >= 10000) return (n/10000).toFixed(1) + 'w'; return n.toLocaleString(); };
  const fmtT = ts => { if (!ts) return ''; const d = new Date(ts); return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

  const availTiers = TIERS.filter(t => presets.some(p => p.tier === t.key));
  const curTier = TIERS.find(t => t.key === selectedTier);
  const tierData = presets.filter(p => p.tier === selectedTier && p.style === viewMode);
  const hasStrategy = presets.some(p => p.tier === selectedTier && p.style === 'strategy');
  const hasGun = presets.some(p => p.tier === selectedTier && p.style === 'gun');

  if (loading) return <div className="loading"><div className="spinner"></div>加载战备数据中...</div>;
  if (!presets.length) return <div><h1 className="page-title">🃏 卡战备系统</h1><div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}><div style={{ fontSize:56, marginBottom:16 }}>🃏</div><p>暂无战备数据</p></div></div>;

  function renderCard(p) {
    const budget = p.budget_min || 0;
    const gearValue = (p.total_price || 0) - (p.accessory_total || 0);
    const accTotal = p.accessory_total || 0;
    const sc = viewMode === 'strategy' ? (SC[p.description] || '#20e870') : (curTier?.color || '#20e870');
    const isExp = expandedId === p.id;
    const accessories = Array.isArray(p.accessories) ? p.accessories : [];

    const items = [];
    if (p.gun_name) items.push({ n: p.gun_name, img: p.gun_image, pr: p.gun_price, g: p.gun_grade, t: '枪械' });
    if (p.helmet_name) items.push({ n: p.helmet_name, img: p.helmet_image, pr: p.helmet_price, g: p.helmet_grade, t: '头盔' });
    if (p.armor_name) items.push({ n: p.armor_name, img: p.armor_image, pr: p.armor_price, g: p.armor_grade, t: '护甲' });
    if (p.chest_name) items.push({ n: p.chest_name, img: p.chest_image, pr: p.chest_price, g: p.chest_grade, t: '胸挂' });
    if (p.backpack_name) items.push({ n: p.backpack_name, img: p.backpack_image, pr: p.backpack_price, g: p.backpack_grade, t: '背包' });

    return (
      <div key={p.id} style={{ background:'var(--bg-card)', border:`1px solid ${sc}20`, borderRadius:14, overflow:'hidden', transition:'border-color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = `${sc}50`}
        onMouseLeave={e => e.currentTarget.style.borderColor = `${sc}20`}>

        {/* 标题 */}
        <div style={{ borderBottom:`3px solid ${sc}`, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
            {SI[p.description] && <span style={{ fontSize:18 }}>{SI[p.description]}</span>}
            <span style={{ fontSize:16, fontWeight:700 }}>{p.description}</span>
          </div>
          {viewMode === 'strategy' && p.gun_name && <span style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>{p.gun_name}</span>}
        </div>

        {/* 装备列表 - 横向滚动无滚动条 */}
        <div className="hide-scrollbar" style={{ padding:'12px 16px', overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <div style={{ display:'flex', gap:8, minWidth:'max-content' }}>
            {items.map((it, i) => {
              const gc = GRADE_COLORS[it.g] || '#6898b0';
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--bg-secondary)', borderRadius:8, border:`1px solid ${gc}20`, minWidth:160, flex:'0 0 auto' }}>
                  {it.img ? <img src={it.img} alt="" style={{ width:34, height:34, objectFit:'contain', borderRadius:6, background:'linear-gradient(135deg,#1a2a3a,#1e3040)', flexShrink:0 }} onError={e => e.target.style.display='none'} />
                  : <div style={{ width:34, height:34, borderRadius:6, background:`${gc}10`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>📦</div>}
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:gc, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.n}</div>
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      <span style={{ fontSize:10, color:'var(--text-muted)' }}>{it.t}</span>
                      {it.g > 0 && <span style={{ fontSize:9, padding:'0 4px', borderRadius:3, background:`${gc}15`, color:gc, fontWeight:600 }}>{it.g}级</span>}
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:"'Orbitron',monospace", flexShrink:0, marginLeft:'auto' }}>{fmtP(it.pr)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 配件 */}
        {accTotal > 0 && (
          <div style={{ borderTop:'1px solid var(--border)', padding:'10px 16px' }}>
            <div onClick={() => setExpandedId(isExp ? null : p.id)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text-secondary)' }}>🔧 推荐配件 ({accessories.length})</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#18a0d0', fontFamily:"'Orbitron',monospace" }}>{fmtP(accTotal)}</span>
                <span style={{ fontSize:14, color:'var(--text-muted)', transition:'transform 0.2s', transform:isExp?'rotate(180deg)':'none' }}>▼</span>
              </div>
            </div>
            {isExp && accessories.length > 0 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
                {accessories.map((acc, i) => {
                  const gc = GRADE_COLORS[acc.grade] || '#6898b0';
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 8px', background:'rgba(24,160,208,0.04)', borderRadius:6, border:'1px solid rgba(24,160,208,0.12)' }}>
                      {acc.image && <img src={acc.image} alt="" style={{ width:26, height:26, objectFit:'contain', borderRadius:5, background:'linear-gradient(135deg,#1a2a3a,#1e3040)', flexShrink:0 }} onError={e => e.target.style.display='none'} />}
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:gc, whiteSpace:'nowrap' }}>{acc.name}</div>
                        <div style={{ fontSize:9, color:'var(--text-muted)' }}>{acc.slot}</div>
                      </div>
                      {acc.price > 0 && <div style={{ fontSize:10, color:'var(--text-secondary)', fontFamily:"'Orbitron',monospace", flexShrink:0, marginLeft:4 }}>{fmtP(acc.price)}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 底部汇总 */}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid var(--border)', background:'rgba(0,0,0,0.1)', flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)' }}>购买成本</div>
            <div style={{ fontSize:15, fontWeight:900, color:'var(--text-primary)', fontFamily:"'Orbitron',monospace" }}>{fmtW(budget)}</div>
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text-muted)' }}>装备价值</div>
            <div style={{ fontSize:15, fontWeight:900, color:sc, fontFamily:"'Orbitron',monospace" }}>{fmtW(gearValue)}</div>
          </div>
          {accTotal > 0 && (
            <div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>配件价值</div>
              <div style={{ fontSize:15, fontWeight:900, color:'#18a0d0', fontFamily:"'Orbitron',monospace" }}>{fmtW(accTotal)}</div>
            </div>
          )}
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)' }}>总估值</div>
            <div style={{ fontSize:15, fontWeight:900, color: p.total_price >= budget ? '#20e870' : '#e04848', fontFamily:"'Orbitron',monospace" }}>{fmtW(p.total_price)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SEO title="卡战备系统" path="/cards" description="三角洲行动卡战备配装推荐，不同预算档位的最优枪械、护甲、装备搭配方案。" />
      <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:4, flexWrap:'wrap' }}>
        <h1 className="page-title" style={{ marginBottom:0 }}>🃏 卡战备系统</h1>
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>更新：{fmtT(lastUpdate)}</span>
      </div>
      <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:20 }}>价格基于交易行实时均价，每小时更新 · 含配件推荐</p>

      {/* 档位 */}
      <div className="hide-scrollbar" style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:4 }}>
        {availTiers.map(t => (
          <button key={t.key} onClick={() => { setSelectedTier(t.key); setExpandedId(null); }} style={{
            background: selectedTier === t.key ? `${t.color}18` : 'var(--bg-card)',
            border: `2px solid ${selectedTier === t.key ? t.color : 'var(--border)'}`,
            borderRadius:12, padding:'10px 14px', cursor:'pointer', transition:'all 0.2s', textAlign:'center', minWidth:80, flex:'0 0 auto',
          }}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:18, fontWeight:900, color: selectedTier === t.key ? t.color : 'var(--text-muted)' }}>{t.budget}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2, whiteSpace:'nowrap' }}>{t.name}</div>
          </button>
        ))}
      </div>

      {/* 切换 */}
      {(hasStrategy || hasGun) && (
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {hasStrategy && <button className={`filter-chip ${viewMode==='strategy'?'active':''}`} onClick={() => { setViewMode('strategy'); setExpandedId(null); }}>⚖️ 策略方案</button>}
          {hasGun && <button className={`filter-chip ${viewMode==='gun'?'active':''}`} onClick={() => { setViewMode('gun'); setExpandedId(null); }}>🔫 多枪方案</button>}
        </div>
      )}

      {/* 方案列表 - 单列布局确保完整显示 */}
      <div style={{ display:'grid', gap:16 }}>
        {tierData.map(p => renderCard(p))}
      </div>

      {tierData.length === 0 && <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>该档位暂无{viewMode==='strategy'?'策略':'多枪'}方案</div>}

      <div style={{ marginTop:24, padding:14, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:13, color:'var(--text-muted)', lineHeight:1.8 }}>
        <strong style={{ color:'var(--text-secondary)' }}>💡 说明：</strong>
        <strong>策略方案</strong>：🔫枪械拉满 / ⚖️均衡 / 🦺胸挂拉满 / 🏃轻装跑图（少配件轻装，适合跑图丢包场景）。
        <strong>多枪方案</strong>：不同枪械+最优装备组合。
        🔧<strong>配件</strong>：点击展开查看推荐配件，价值已计入总估值。
        品级：<span style={{ color:'#ffc040' }}> ■5级</span><span style={{ color:'#c060e0' }}> ■4级</span><span style={{ color:'#40a0e0' }}> ■3级</span><span style={{ color:'#40d070' }}> ■2级</span>
      </div>
    </div>
  );
}

export default Loadout;