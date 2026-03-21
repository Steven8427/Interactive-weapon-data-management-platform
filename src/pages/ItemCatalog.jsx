import React, { useState, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useCachedData } from '../dataCache';
import SEO from '../components/SEO';

const GRADE_COLOR = { 6: '#e04848', 5: '#ffc040', 4: '#c060e0', 3: '#40a0e0', 2: '#40d070', 1: '#c0c8d0', 0: '#6080a0' };
const GRADE_NAME = { 6: '传说', 5: '史诗', 4: '稀有', 3: '精良', 2: '普通', 1: '简陋', 0: '无' };
const CLASS_ICON = { 'props': '📦', 'gun': '🔫', 'attachment': '🔧', 'armor': '🛡️', 'equipment': '🎒', 'melee': '🔪' };
const CLASS_NAME = { 'props': '物资道具', 'gun': '枪械', 'attachment': '配件', 'armor': '护甲', 'equipment': '装备', 'melee': '近战' };

function ItemCatalog() {
  const [search, setSearch] = useState('');
  const [primaryFilter, setPrimaryFilter] = useState('全部');
  const [subFilter, setSubFilter] = useState('全部');
  const [gradeFilter, setGradeFilter] = useState('全部');
  const [sortBy, setSortBy] = useState('grade_desc');
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase.from('game_items').select('*').order('grade', { ascending: false }).order('avg_price', { ascending: false });
    return data || [];
  }, []);

  const [rawItems, loading] = useCachedData('item_catalog', fetchItems);
  const items = rawItems || [];

  // 动态主分类 tab（只显示有数据的）
  const primaryTabs = useMemo(() => {
    const classSet = new Set();
    items.forEach(i => { if (i.primary_class) classSet.add(i.primary_class); });
    const tabs = [{ key: '全部', label: '全部' }];
    for (const cls of ['props', 'gun', 'attachment', 'armor', 'equipment', 'melee']) {
      if (classSet.has(cls)) tabs.push({ key: cls, label: `${CLASS_ICON[cls] || ''} ${CLASS_NAME[cls] || cls}` });
    }
    return tabs;
  }, [items]);

  // 子分类
  const subCategories = useMemo(() => {
    if (primaryFilter === '全部') return ['全部'];
    const filtered = items.filter(i => i.primary_class === primaryFilter);
    const s = new Set();
    if (primaryFilter === 'props') {
      if (filtered.some(i => i.second_class_cn === '钥匙')) s.add('🔑 钥匙');
      filtered.forEach(i => { if (i.props_type) s.add(i.props_type); });
    } else {
      filtered.forEach(i => { if (i.second_class_cn) s.add(i.second_class_cn); });
    }
    return ['全部', ...Array.from(s).sort()];
  }, [items, primaryFilter]);

  const filtered = useMemo(() => {
    let r = items;
    if (primaryFilter !== '全部') r = r.filter(i => i.primary_class === primaryFilter);
    if (subFilter !== '全部') {
      if (subFilter === '🔑 钥匙') r = r.filter(i => i.second_class_cn === '钥匙');
      else if (primaryFilter === 'props') r = r.filter(i => i.props_type === subFilter);
      else r = r.filter(i => i.second_class_cn === subFilter);
    }
    if (gradeFilter !== '全部') r = r.filter(i => i.grade === parseInt(gradeFilter));
    if (search.trim()) { const s = search.toLowerCase(); r = r.filter(i => i.object_name.toLowerCase().includes(s) || i.description?.toLowerCase().includes(s) || i.props_source?.toLowerCase().includes(s)); }
    if (sortBy === 'grade_desc') r = [...r].sort((a, b) => b.grade - a.grade || b.avg_price - a.avg_price);
    if (sortBy === 'price_desc') r = [...r].sort((a, b) => b.avg_price - a.avg_price);
    if (sortBy === 'price_asc') r = [...r].sort((a, b) => (a.avg_price || 999999999) - (b.avg_price || 999999999));
    if (sortBy === 'name') r = [...r].sort((a, b) => a.object_name.localeCompare(b.object_name));
    return r;
  }, [items, primaryFilter, subFilter, gradeFilter, search, sortBy]);

  function formatPrice(n) { if (!n) return '-'; if (n >= 10000) return (n / 10000).toFixed(1) + 'w'; return n.toLocaleString(); }
  function getSubName(item) { return item.props_type || item.second_class_cn || ''; }

  if (loading) return <div className="loading"><div className="spinner"></div>加载物品数据...</div>;

  if (selectedItem) {
    const item = selectedItem;
    const gc = GRADE_COLOR[item.grade] || '#6080a0';
    return (
      <div>
        <button onClick={() => setSelectedItem(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 16 }}>← 返回物品列表</button>
        <div style={{ background: 'var(--bg-card)', border: `1px solid ${gc}40`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {item.pic && <img src={item.pic} alt="" style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 12, background: 'linear-gradient(135deg, #1a2a3a, #1e3040)', border: `2px solid ${gc}40`, padding: 8 }} />}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: gc, marginBottom: 6 }}>{item.object_name}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: `${gc}15`, color: gc, border: `1px solid ${gc}30`, fontSize: 12, fontWeight: 700 }}>{GRADE_NAME[item.grade]} {item.grade}级</span>
                {item.props_type && <span style={{ padding: '3px 10px', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }}>{item.props_type}</span>}
                <span style={{ padding: '3px 10px', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 12 }}>{item.second_class_cn}</span>
              </div>
              {item.avg_price > 0 && <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', fontFamily: "'Orbitron', monospace", marginBottom: 12 }}>{formatPrice(item.avg_price)}</div>}
              {item.description && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{item.description}</p>}
              {item.props_source && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}><span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>产出地点：</span>{item.props_source}</div>}
              {item.weight && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>重量：{item.weight}kg · 尺寸：{item.length}×{item.width}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SEO title="物品图鉴" path="/items" description="三角洲行动全物品图鉴百科，收录所有枪械、配件、护甲、装备的详细信息和价格。" />
      <h1 className="page-title">📖 物品图鉴</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>三角洲行动所有物品信息 · {items.length} 个物品</p>

      <div className="filter-bar">
        {primaryTabs.map(t => (
          <button key={t.key} className={`filter-chip ${primaryFilter === t.key ? 'active' : ''}`}
            onClick={() => { setPrimaryFilter(t.key); setSubFilter('全部'); }}>{t.label}</button>
        ))}
      </div>

      {subCategories.length > 2 && (
        <div className="filter-bar" style={{ marginBottom: 10 }}>
          {subCategories.map(s => (
            <button key={s} className={`filter-chip ${subFilter === s ? 'active' : ''}`}
              onClick={() => setSubFilter(s)} style={{ fontSize: 12, padding: '4px 10px' }}>{s}</button>
          ))}
        </div>
      )}

      <div className="search-row">
        <div className="search-bar"><span className="search-icon">🔍</span><input placeholder="搜索物品名称、描述、产出地..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="filter-select" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          <option value="全部">全部品级</option>
          {[6,5,4,3,2,1].map(g => <option key={g} value={g}>{GRADE_NAME[g]} {g}级</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="grade_desc">品级 高→低</option>
          <option value="price_desc">价格 高→低</option>
          <option value="price_asc">价格 低→高</option>
          <option value="name">名称排序</option>
        </select>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>找到 {filtered.length} 个物品</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
        {filtered.map(item => {
          const gc = GRADE_COLOR[item.grade] || '#6080a0';
          return (
            <div key={item.id} onClick={() => setSelectedItem(item)} style={{
              background: 'var(--bg-card)', border: `1px solid ${gc}25`, borderRadius: 10,
              padding: 12, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', overflow: 'hidden',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${gc}60`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${gc}25`; e.currentTarget.style.transform = 'none'; }}
            >
              {item.pic && <img src={item.pic} alt="" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8, background: 'linear-gradient(135deg, #1a2a3a, #1e3040)', border: `1px solid ${gc}30`, padding: 4, marginBottom: 8 }} />}
              <div style={{ fontSize: 13, fontWeight: 700, color: gc, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{item.object_name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSubName(item)}</div>
              {item.avg_price > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', fontFamily: "'Orbitron', monospace" }}>{formatPrice(item.avg_price)}</div>}
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>没有找到匹配的物品</div>}
    </div>
  );
}

export default ItemCatalog;