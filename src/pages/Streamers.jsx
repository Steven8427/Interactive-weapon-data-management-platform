import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useCachedData } from '../dataCache';
import SEO from '../components/SEO';

const CAT_COLOR = {"突击步枪":"#30d060","战斗步枪":"#e0a030","射手步枪":"#50b0e0","冲锋枪":"#d050d0","机枪":"#e06030","狙击步枪":"#4090f0","连狙":"#60c0c0","霰弹枪":"#d04040","手枪":"#a0a0a0","弓弩":"#90d040"};
const SLOT_NAME = {"1":"弹匣","2":"枪口","3":"握把","5":"枪托","6":"瞄具","8":"激光","11":"护木","17":"导轨","20":"导轨","32":"导轨","34":"导轨","35":"导轨","44":"弹鼓"};

function Streamers() {
  const [selectedStreamer, setSelectedStreamer] = useState(null);
  const [search, setSearch] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = useCallback(async () => {
    const [{ data: codesData }, { data: itemsData }, { data: streamersData }] = await Promise.all([
      supabase.from('official_gun_codes').select('*').neq('is_hidden', true).order('apply_num', { ascending: false }),
      supabase.from('game_items').select('object_id, object_name, pic, avg_price, grade, second_class_cn'),
      supabase.from('streamers').select('*').eq('is_hidden', false).order('sort_order'),
    ]);
    const map = {};
    (itemsData || []).forEach(i => { map[i.object_id] = i; });
    return { codes: codesData || [], itemsMap: map, streamersOrder: streamersData || [] };
  }, []);

  const [data, loading] = useCachedData('streamers', fetchData);
  const codes = data?.codes || [];
  const itemsMap = data?.itemsMap || {};
  const streamersOrder = data?.streamersOrder || [];

  const streamers = useMemo(() => {
    // 按 codes 聚合统计
    const map = {};
    codes.forEach(c => {
      const name = c.author_nickname || '未知';
      if (!map[name]) map[name] = { name, avatar: c.author_avatar, codes: [], totalApply: 0, totalLikes: 0 };
      map[name].codes.push(c); map[name].totalApply += (c.apply_num || 0); map[name].totalLikes += (c.like_num || 0);
      if (c.author_avatar && !map[name].avatar) map[name].avatar = c.author_avatar;
    });
    // 按 streamers 表的 sort_order 排序，优先用 streamers 表的头像
    if (streamersOrder.length) {
      const orderMap = {};
      streamersOrder.forEach((s, i) => { orderMap[s.name] = { sort: i, avatar: s.avatar_url }; });
      Object.values(map).forEach(s => {
        if (orderMap[s.name]?.avatar) s.avatar = orderMap[s.name].avatar;
      });
      return Object.values(map).sort((a, b) => {
        const aSort = orderMap[a.name]?.sort ?? 9999;
        const bSort = orderMap[b.name]?.sort ?? 9999;
        return aSort - bSort;
      });
    }
    return Object.values(map).sort((a, b) => b.totalApply - a.totalApply);
  }, [codes, streamersOrder]);

  const filteredStreamers = useMemo(() => {
    if (!search.trim()) return streamers;
    return streamers.filter(st => st.name.toLowerCase().includes(search.toLowerCase()));
  }, [streamers, search]);

  const streamerCodes = useMemo(() => {
    if (!selectedStreamer) return [];
    let list = codes.filter(c => c.author_nickname === selectedStreamer).sort((a, b) => (b.apply_num || 0) - (a.apply_num || 0));
    if (codeSearch.trim()) { const s = codeSearch.toLowerCase(); list = list.filter(c => c.name?.toLowerCase().includes(s) || c.arms_name?.toLowerCase().includes(s)); }
    return list;
  }, [codes, selectedStreamer, codeSearch]);

  function copyCode(code, e) { if (e) e.stopPropagation(); navigator.clipboard.writeText(code).then(() => toast.success('改枪码已复制！')).catch(() => { const ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast.success('改枪码已复制！'); }); }
  function formatNum(n) { if (!n) return '0'; if (n >= 10000) return (n/10000).toFixed(1) + 'w'; if (n >= 1000) return (n/1000).toFixed(1) + 'k'; return String(n); }
  function formatPrice(n) { if (!n) return '-'; if (n >= 10000) return (n/10000).toFixed(1) + 'w'; return n.toLocaleString(); }

  function getAccessories(code) {
    try {
      const acc = typeof code.accessory === 'string' ? JSON.parse(code.accessory) : code.accessory;
      if (!Array.isArray(acc)) return [];
      return acc.map(a => {
        const item = itemsMap[a.objectID];
        const slotName = SLOT_NAME[String(a.slotID)] || `插槽${a.slotID}`;
        return { name: item?.object_name || slotName, pic: item?.pic || `https://playerhub.df.qq.com/playerhub/60004/object/${a.objectID}.png`, price: item?.avg_price || 0, grade: item?.grade || 0, slot: item?.second_class_cn || slotName };
      });
    } catch { return []; }
  }

  if (loading) return <div className="loading"><div className="spinner"></div>加载主播数据...</div>;

  // 主播改枪码详情
  if (selectedStreamer) {
    const s = streamers.find(x => x.name === selectedStreamer);
    return (
      <div>
        <button onClick={() => { setSelectedStreamer(null); setCodeSearch(''); setExpandedId(null); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 16, display: 'block' }}>← 返回主播列表</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {s?.avatar ? <img src={s.avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', flexShrink: 0 }} />
          : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(32,232,112,0.1)', border: '3px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{selectedStreamer.charAt(0)}</div>}
          <div style={{ minWidth: 0 }}>
            <h1 className="page-title" style={{ fontSize: 22, marginBottom: 2 }}>{selectedStreamer}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s?.codes.length} 个方案 · {formatNum(s?.totalApply)} 使用 · 点击展开查看配件</p>
          </div>
        </div>

        <div className="search-bar" style={{ marginBottom: 16, flex: 'none' }}>
          <span className="search-icon">🔍</span>
          <input placeholder="搜索枪名或方案名..." value={codeSearch} onChange={e => setCodeSearch(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {streamerCodes.map(code => {
            const catC = CAT_COLOR[code.arms_category] || '#20e870';
            const isExpanded = expandedId === code.id;
            const accessories = isExpanded ? getAccessories(code) : [];
            const accTotal = accessories.reduce((s, a) => s + a.price, 0);

            return (
              <div key={code.id} style={{ background: 'var(--bg-card)', border: `1px solid ${isExpanded ? catC+'40' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <div onClick={() => setExpandedId(isExpanded ? null : code.id)} style={{ padding: '14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    {code.arms_pic && <img src={code.arms_pic} alt="" style={{ width: 56, height: 40, objectFit: 'contain', borderRadius: 6, flexShrink: 0, background: 'linear-gradient(135deg, #1a2a3a, #1e3040)', border: '1px solid var(--border)', padding: 2 }} onError={e => e.target.style.display = 'none'} />}
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
                  {code.author_comment && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code.author_comment}</div>}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div onClick={e => copyCode(code.solution_code, e)} style={{ flex: 1, fontFamily: "'Courier New', monospace", fontSize: 12, color: 'var(--accent)', background: 'rgba(32,232,112,0.04)', border: '1px solid rgba(32,232,112,0.1)', borderRadius: 6, padding: '6px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code.solution_code}</div>
                    <span style={{ fontSize: 18, color: 'var(--text-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </div>
                </div>

                {/* 展开配件 */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${catC}25`, padding: '14px', background: 'rgba(0,0,0,0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>🔧 配件详情 ({accessories.length})</span>
                      {accTotal > 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>配件总价：<span style={{ color: '#18a0d0', fontWeight: 700, fontFamily: "'Orbitron', monospace" }}>{formatPrice(accTotal)}</span></span>}
                    </div>
                    {accessories.length === 0 ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>无配件数据</p> : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 }}>
                        {accessories.map((acc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
                            <img src={acc.pic} alt="" style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 5, background: 'linear-gradient(135deg,#1a2a3a,#1e3040)', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</div>
                              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{acc.slot}</div>
                            </div>
                            {acc.price > 0 && <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: "'Orbitron', monospace", flexShrink: 0 }}>{formatPrice(acc.price)}</div>}
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
      </div>
    );
  }

  // 主播列表
  return (
    <div>
      <SEO title="主播同款改枪码" path="/streamers" description="三角洲行动主播改枪码合集，热门主播同款武器配置方案，一键复制使用。" />
      <h1 className="page-title">🎙️ 主播同款改枪码</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>来自官方社区 · {streamers.length} 位主播 · {codes.length} 个方案</p>
      <div className="search-bar" style={{ marginBottom: 20, flex: 'none' }}><span className="search-icon">🔍</span><input placeholder="搜索主播名称..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      {filteredStreamers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>没有找到「{search}」相关的主播</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {filteredStreamers.map(s => (
            <div key={s.name} className="author-card" onClick={() => setSelectedStreamer(s.name)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                {s.avatar ? <img src={s.avatar} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)', flexShrink: 0 }} />
                : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(32,232,112,0.1)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.name.charAt(0)}</div>}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.codes.length} 个方案</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>总使用</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e0a030', fontFamily: "'Orbitron', monospace" }}>{formatNum(s.totalApply)}</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>总点赞</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e04848', fontFamily: "'Orbitron', monospace" }}>{formatNum(s.totalLikes)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {s.codes.slice(0, 4).map(c => c.arms_pic ? <img key={c.id} src={c.arms_pic} alt="" style={{ width: 40, height: 28, objectFit: 'contain', borderRadius: 5, background: 'linear-gradient(135deg, #1a2a3a, #1e3040)', border: '1px solid var(--border)', padding: 1 }} /> : null)}
                {s.codes.length > 4 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{s.codes.length - 4}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Streamers;